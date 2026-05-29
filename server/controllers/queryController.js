const axios = require('axios');
const Query = require('../models/Query');

// Helper to map Open-Meteo weather code to standard descriptive strings
const mapOpenMeteoCode = (code) => {
  const codeMap = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return codeMap[code] || 'Unspecified Weather';
};

// Helper to resolve coordinates via Geocoding fallbacks inside query Controller
const resolveLocationInternal = async (query) => {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey && googleKey !== 'your_key' && googleKey.trim() !== '') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`;
      const response = await axios.get(url);
      if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const { lat, lng } = result.geometry.location;
        let city = '';
        for (const comp of result.address_components) {
          if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')) {
            city = comp.long_name;
            break;
          }
        }
        return { lat, lon: lng, city: city || result.formatted_address.split(',')[0] };
      }
    } catch (e) {
      console.warn('Geocoding internally failed, using Open-Meteo...');
    }
  }

  // Open-Meteo Geocoding
  try {
    const response = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return { lat: result.latitude, lon: result.longitude, city: result.name };
    }
  } catch (e) {
    console.error('Open-Meteo internal geocoding failed:', e.message);
  }

  throw new Error(`Location "${query}" could not be resolved by geocoding API.`);
};

// POST /api/queries
exports.createQuery = async (req, res, next) => {
  try {
    const { location, dateFrom, dateTo, notes } = req.body;

    // 1. Validations
    if (!location || !dateFrom || !dateTo) {
      return res.status(400).json({ error: true, message: 'Location, dateFrom, and dateTo are required', code: 400 });
    }

    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: true, message: 'dateFrom and dateTo must be valid ISO dates', code: 400 });
    }

    if (start > end) {
      return res.status(400).json({ error: true, message: 'dateFrom must not be after dateTo', code: 400 });
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return res.status(400).json({ error: true, message: 'Date range must not exceed 30 days', code: 400 });
    }

    // 2. Resolve location to coordinates
    const resolved = await resolveLocationInternal(location);

    // 3. Fetch historical/forecast weather from Open-Meteo API
    const dateFromStr = start.toISOString().split('T')[0];
    const dateToStr = end.toISOString().split('T')[0];

    let response;
    try {
      const meteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${resolved.lat}&longitude=${resolved.lon}&start_date=${dateFromStr}&end_date=${dateToStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
      response = await axios.get(meteoUrl);
    } catch (err) {
      console.warn('Open-Meteo Archive failed. Attempting Forecast API fallback...', err.message);
      if (err.response && err.response.data) {
        console.warn('Archive API Error Detail:', JSON.stringify(err.response.data));
      }
      try {
        const forecastMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolved.lat}&longitude=${resolved.lon}&start_date=${dateFromStr}&end_date=${dateToStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        response = await axios.get(forecastMeteoUrl);
      } catch (fallbackErr) {
        console.error('Both Open-Meteo Archive and Forecast APIs failed:', fallbackErr.message);
        if (fallbackErr.response && fallbackErr.response.data) {
          console.error('Forecast API Error Detail:', JSON.stringify(fallbackErr.response.data));
        }
        return res.status(400).json({ 
          error: true, 
          message: 'Weather data for this date range is unavailable. Please verify dates are not too far in the future.', 
          code: 400 
        });
      }
    }
    
    if (!response.data || !response.data.daily) {
      return res.status(404).json({ error: true, message: 'No weather data returned from Open-Meteo for this date range', code: 404 });
    }

    const daily = response.data.daily;
    const weatherData = (daily.time || []).map((date, idx) => ({
      date,
      maxTemp: daily.temperature_2m_max[idx],
      minTemp: daily.temperature_2m_min[idx],
      weatherCode: daily.weathercode[idx],
      description: mapOpenMeteoCode(daily.weathercode[idx])
    }));

    // 4. Save Query in MongoDB
    const newQuery = new Query({
      location,
      resolvedCity: resolved.city,
      lat: resolved.lat,
      lon: resolved.lon,
      dateFrom: start,
      dateTo: end,
      weatherData,
      notes
    });

    const saved = await newQuery.save();
    return res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// GET /api/queries
exports.getQueries = async (req, res, next) => {
  try {
    const { location, limit = 20, skip = 0 } = req.query;

    const filter = {};
    if (location) {
      // Support soft partial keyword matches on location or resolvedCity
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { resolvedCity: { $regex: location, $options: 'i' } }
      ];
    }

    const queries = await Query.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    return res.json(queries);
  } catch (err) {
    next(err);
  }
};

// GET /api/queries/:id
exports.getQueryById = async (req, res, next) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: true, message: 'Saved query record not found', code: 404 });
    }
    return res.json(query);
  } catch (err) {
    next(err);
  }
};

// PUT /api/queries/:id
exports.updateQuery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { location, dateFrom, dateTo, notes } = req.body;

    const queryDoc = await Query.findById(id);
    if (!queryDoc) {
      return res.status(404).json({ error: true, message: 'Saved query record not found', code: 404 });
    }

    let isChanged = false;
    let resolved = { lat: queryDoc.lat, lon: queryDoc.lon, city: queryDoc.resolvedCity };
    let start = queryDoc.dateFrom;
    let end = queryDoc.dateTo;

    // Validate location change
    if (location && location !== queryDoc.location) {
      resolved = await resolveLocationInternal(location);
      queryDoc.location = location;
      queryDoc.resolvedCity = resolved.city;
      queryDoc.lat = resolved.lat;
      queryDoc.lon = resolved.lon;
      isChanged = true;
    }

    // Validate dates changes
    if (dateFrom || dateTo) {
      start = dateFrom ? new Date(dateFrom) : queryDoc.dateFrom;
      end = dateTo ? new Date(dateTo) : queryDoc.dateTo;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: true, message: 'dateFrom and dateTo must be valid ISO dates', code: 400 });
      }

      if (start > end) {
        return res.status(400).json({ error: true, message: 'dateFrom must not be after dateTo', code: 400 });
      }

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        return res.status(400).json({ error: true, message: 'Date range must not exceed 30 days', code: 400 });
      }

      if (start.getTime() !== queryDoc.dateFrom.getTime() || end.getTime() !== queryDoc.dateTo.getTime()) {
        queryDoc.dateFrom = start;
        queryDoc.dateTo = end;
        isChanged = true;
      }
    }

    if (notes !== undefined) {
      queryDoc.notes = notes;
    }

    // If locations or dates were updated, re-fetch the historical/forecast Open-Meteo metrics
    if (isChanged) {
      const dateFromStr = start.toISOString().split('T')[0];
      const dateToStr = end.toISOString().split('T')[0];

      let response;
      try {
        const meteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${resolved.lat}&longitude=${resolved.lon}&start_date=${dateFromStr}&end_date=${dateToStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        response = await axios.get(meteoUrl);
      } catch (err) {
        console.warn('Open-Meteo Archive update failed (likely current/future dates). Attempting Forecast API fallback...', err.message);
        try {
          const forecastMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolved.lat}&longitude=${resolved.lon}&start_date=${dateFromStr}&end_date=${dateToStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
          response = await axios.get(forecastMeteoUrl);
        } catch (fallbackErr) {
          console.error('Both Open-Meteo Archive and Forecast APIs failed on update:', fallbackErr.message);
          return res.status(400).json({ 
            error: true, 
            message: 'Weather data for this date range is unavailable. Please verify dates are not too far in the future.', 
            code: 400 
          });
        }
      }

      if (response.data && response.data.daily) {
        const daily = response.data.daily;
        queryDoc.weatherData = (daily.time || []).map((date, idx) => ({
          date,
          maxTemp: daily.temperature_2m_max[idx],
          minTemp: daily.temperature_2m_min[idx],
          weatherCode: daily.weathercode[idx],
          description: mapOpenMeteoCode(daily.weathercode[idx])
        }));
      }
    }

    const updated = await queryDoc.save();
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/queries/:id
exports.deleteQuery = async (req, res, next) => {
  try {
    const deleted = await Query.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'Saved query record not found', code: 404 });
    }
    return res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    next(err);
  }
};
