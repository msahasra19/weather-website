const axios = require('axios');
const mongoose = require('mongoose');
const WeatherCache = require('../models/WeatherCache');

// Helper to resolve coordinates either from GPS pattern or via Geocoding APIs
const resolveLocation = async (locationQuery) => {
  if (!locationQuery || typeof locationQuery !== 'string') {
    throw new Error('Location query is required');
  }

  const query = locationQuery.trim();

  // 1. Regex check if input is directly GPS coordinates: "17.3850,78.4867"
  const gpsRegex = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;
  const gpsMatch = query.match(gpsRegex);
  if (gpsMatch) {
    const lat = parseFloat(gpsMatch[1]);
    const lon = parseFloat(gpsMatch[2]);
    return {
      lat,
      lon,
      city: `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      country: 'GPS'
    };
  }

  // 2. Google Geocoding API call if API key exists
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey && googleKey !== 'your_key' && googleKey.trim() !== '') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`;
      const response = await axios.get(url);
      
      if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const { lat, lng } = result.geometry.location;
        
        // Find city and country from address_components
        let city = '';
        let country = '';
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1') && !city) {
            city = component.long_name;
          } else if (component.types.includes('country')) {
            country = component.short_name;
          }
        }
        
        return {
          lat,
          lon: lng,
          city: city || result.formatted_address.split(',')[0],
          country: country || 'Unknown'
        };
      }
    } catch (err) {
      console.warn('Google Geocoding failed, attempting fallback...', err.message);
    }
  }

  // 3. Graceful Fallback: Free, keyless Open-Meteo Geocoding API
  try {
    const fallbackUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await axios.get(fallbackUrl);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        city: result.name,
        country: result.country_code || 'Unknown'
      };
    }
  } catch (err) {
    console.error('Fallback Open-Meteo Geocoding also failed:', err.message);
  }

  // 4. Last Ditch Fallback: OpenStreetMap Nominatim
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await axios.get(osmUrl, {
      headers: { 'User-Agent': 'WeatherIQ-AI-Tech-Assessment' }
    });
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        city: result.display_name.split(',')[0],
        country: 'OSM'
      };
    }
  } catch (err) {
    console.error('OSM Nominatim Geocoding failed:', err.message);
  }

  throw new Error(`Location "${query}" could not be resolved. Please try a different city, ZIP, or landmark.`);
};

// Fallback AI Weather Narrative builder inside server if API key is not active
const generateFallbackNarrative = (weatherData, city) => {
  const current = weatherData.current;
  const temp = Math.round(current.temp);
  const feelsLike = Math.round(current.feelsLike);
  
  // Sentence 1: Current feel
  let s1 = `Good day, ${city}! Right now it feels like a comfortable ${feelsLike}°C with ${current.description} skies overhead.`;
  if (feelsLike > 30) {
    s1 = `Hello, ${city}! We are experiencing a sweltering day that feels like ${feelsLike}°C, with ${current.description} skies making it extra intense.`;
  } else if (feelsLike < 10) {
    s1 = `Bundle up, ${city}! It is a chilly one out there, feeling like a brisk ${feelsLike}°C under ${current.description} skies.`;
  }
  
  // Sentence 2: Activity/Health advice
  let s2 = `It's a perfect day to head outdoors, but remember to stay hydrated!`;
  if (current.humidity > 85) {
    s2 = `With humidity up at ${current.humidity}%, outdoor exercises might feel slightly heavy, so make sure to take regular water breaks.`;
  } else if (feelsLike < 5) {
    s2 = `Keep your warm coats close to prevent catching a cold, and consider indoor activities today.`;
  } else if (current.description.includes('rain') || current.description.includes('drizzle')) {
    s2 = `Don't forget your umbrella today to stay dry, and be cautious of slippery roads if you are driving.`;
  }
  
  // Sentence 3: Weekly forecast trend
  const firstForecast = weatherData.forecast[0] || {};
  let s3 = `Looking ahead, we can expect a steady weekly trend with mild shifts in temperature.`;
  if (firstForecast.temp > temp + 3) {
    s3 = `Keep summer clothes ready, as a notable warm-up is on the way for the week ahead!`;
  } else if (firstForecast.temp < temp - 3) {
    s3 = `Make sure to prepare for a notable cold front sweeping through during the week ahead.`;
  }
  
  return `${s1} ${s2} ${s3}`;
};

// GET /api/weather/current
exports.getCurrentWeather = async (req, res, next) => {
  try {
    const { location, lat: reqLat, lon: reqLon } = req.query;
    let resolved;

    // A. Resolve Location coordinates
    if (reqLat && reqLon) {
      // Direct Coordinates from GPS button
      resolved = {
        lat: parseFloat(reqLat),
        lon: parseFloat(reqLon),
        city: `Local GPS (${parseFloat(reqLat).toFixed(3)}, ${parseFloat(reqLon).toFixed(3)})`,
        country: 'GPS'
      };
    } else if (location) {
      resolved = await resolveLocation(location);
    } else {
      return res.status(400).json({ error: true, message: 'Location or lat/lon parameters are required', code: 400 });
    }

    const cacheKey = `${resolved.lat.toFixed(3)}_${resolved.lon.toFixed(3)}`;

    // B. Check in MongoDB TTL Cache (within last hour)
    let existingCache = null;
    if (mongoose.connection.readyState === 1) {
      try {
        existingCache = await WeatherCache.findOne({
          $or: [
            { location: location ? location.toLowerCase() : cacheKey },
            { lat: { $gte: resolved.lat - 0.01, $lte: resolved.lat + 0.01 }, lon: { $gte: resolved.lon - 0.01, $lte: resolved.lon + 0.01 } }
          ]
        });
      } catch (dbErr) {
        console.warn('MongoDB cache read failed, bypassing cache...', dbErr.message);
      }
    }

    if (existingCache) {
      console.log('Serving current weather from MongoDB cache...');
      return res.json(existingCache.data);
    }

    // C. Fetch from OpenWeatherMap API
    const owmKey = process.env.OPENWEATHER_API_KEY;
    if (!owmKey) {
      return res.status(500).json({ error: true, message: 'OpenWeatherMap API key is missing in server environment', code: 500 });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${resolved.lat}&lon=${resolved.lon}&appid=${owmKey}&units=metric`;
    const owmResponse = await axios.get(weatherUrl);
    const data = owmResponse.data;

    // Fetch OpenWeatherMap 5-day/3-hour forecast API internally for AI Weather Narrator compilation
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${resolved.lat}&lon=${resolved.lon}&appid=${owmKey}&units=metric`;
    let forecastList = [];
    try {
      const forecastResponse = await axios.get(forecastUrl);
      forecastList = forecastResponse.data.list || [];
    } catch (forecastErr) {
      console.warn('Could not fetch forecast for AI Weather Narrator:', forecastErr.message);
    }

    // Compile structured weather JSON data to feed the AI
    const compiledWeatherData = {
      current: {
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        description: data.weather[0].description
      },
      forecast: forecastList.slice(0, 8).map(item => ({
        time: item.dt_txt,
        temp: item.main.temp,
        description: item.weather[0].description
      }))
    };

    // D. Call Google Gemini API to generate Weather Narrative Briefing
    let narrative = '';
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'your_key' && geminiKey.trim() !== '') {
      try {
        console.log('Sending weather compilation to Google Gemini API (gemini-1.5-flash)...');
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const geminiResponse = await axios.post(geminiUrl, {
          systemInstruction: {
            parts: [
              {
                text: "You are a friendly local weather reporter. Given weather JSON, write a 3-sentence conversational briefing. Mention: current feel, any health/activity advice, and one notable thing about the week ahead. Keep it under 60 words."
              }
            ]
          },
          contents: [
            {
              parts: [
                {
                  text: `Here is the weather data: ${JSON.stringify(compiledWeatherData)}`
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 150
          }
        });

        if (
          geminiResponse.data && 
          geminiResponse.data.candidates && 
          geminiResponse.data.candidates[0] && 
          geminiResponse.data.candidates[0].content && 
          geminiResponse.data.candidates[0].content.parts[0]
        ) {
          narrative = geminiResponse.data.candidates[0].content.parts[0].text.trim();
          console.log('Successfully generated AI Narrative from Google Gemini.');
        } else {
          throw new Error('Malformed Gemini response structure');
        }
      } catch (err) {
        console.warn('Gemini API call failed, deploying conversational fallback brief:', err.message);
        narrative = generateFallbackNarrative(compiledWeatherData, resolved.city);
      }
    } else {
      console.log('No GEMINI_API_KEY detected in .env. Deploying conversational fallback brief...');
      narrative = generateFallbackNarrative(compiledWeatherData, resolved.city);
    }

    // E. Map to required standard structure
    const structuredResult = {
      city: resolved.city || data.name,
      country: resolved.country || (data.sys && data.sys.country),
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      lat: resolved.lat,
      lon: resolved.lon,
      timezone: data.timezone, // shift in seconds from UTC
      aiNarrative: narrative // <--- Premium Narrator mapping stored in MongoDB cache
    };

    // F. Save to MongoDB TTL Cache (1-hour expiration is handled by MongoDB schema index)
    if (mongoose.connection.readyState === 1) {
      try {
        await WeatherCache.create({
          location: location ? location.toLowerCase() : cacheKey,
          lat: resolved.lat,
          lon: resolved.lon,
          data: structuredResult
        });
      } catch (dbErr) {
        console.warn('MongoDB cache write failed:', dbErr.message);
      }
    }

    return res.json(structuredResult);
  } catch (err) {
    if (err.response && err.response.status === 429) {
      // Graceful degradation on OWM rate limit
      console.warn('OpenWeatherMap API Rate limited (429). Attempting to fetch last cache...');
      if (mongoose.connection.readyState === 1) {
        try {
          const fallbackCache = await WeatherCache.findOne().sort({ fetchedAt: -1 });
          if (fallbackCache) {
            return res.json(fallbackCache.data);
          }
        } catch (dbErr) {
          console.error('Fallback cache read failed:', dbErr.message);
        }
      }
    }
    next(err);
  }
};

// GET /api/weather/forecast
exports.getForecast = async (req, res, next) => {
  try {
    const { location, lat: reqLat, lon: reqLon } = req.query;
    let resolved;

    if (reqLat && reqLon) {
      resolved = { lat: parseFloat(reqLat), lon: parseFloat(reqLon) };
    } else if (location) {
      resolved = await resolveLocation(location);
    } else {
      return res.status(400).json({ error: true, message: 'Location or lat/lon parameters are required', code: 400 });
    }

    // Call OpenWeatherMap 5-day/3-hour forecast API
    const owmKey = process.env.OPENWEATHER_API_KEY;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${resolved.lat}&lon=${resolved.lon}&appid=${owmKey}&units=metric`;
    
    const response = await axios.get(forecastUrl);
    const list = response.data.list;

    // Group 3-hour entries by local/calendar date
    const dailyMap = {};

    list.forEach((item) => {
      // Get date string (YYYY-MM-DD)
      const dateStr = item.dt_txt.split(' ')[0];
      
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          temps: [],
          descriptions: [],
          icons: [],
          dt: item.dt
        };
      }
      dailyMap[dateStr].temps.push(item.main.temp);
      dailyMap[dateStr].descriptions.push(item.weather[0].description);
      dailyMap[dateStr].icons.push(item.weather[0].icon);
    });

    // Map grouped dates to 5 individual forecast days
    const forecast = Object.keys(dailyMap).slice(0, 5).map((date) => {
      const dayData = dailyMap[date];
      const maxTemp = Math.max(...dayData.temps);
      const minTemp = Math.min(...dayData.temps);
      
      // Determine dominant description / icon (use middle item or mode)
      const midIndex = Math.floor(dayData.descriptions.length / 2);
      const description = dayData.descriptions[midIndex] || dayData.descriptions[0];
      const icon = dayData.icons[midIndex] || dayData.icons[0];

      // Convert date string to weekday name
      const dateObj = new Date(dayData.dt * 1000);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

      return {
        date,
        dayName,
        maxTemp: Math.round(maxTemp),
        minTemp: Math.round(minTemp),
        description,
        icon
      };
    });

    return res.json({
      resolved,
      forecast
    });
  } catch (err) {
    next(err);
  }
};
