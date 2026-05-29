const axios = require('axios');
const SearchHistory = require('../models/SearchHistory');

// Helper to generate AI Insights
const generateAIInsights = (weather, aqi, uvi) => {
  const insights = [];
  
  // Temperature logic
  if (weather.temp > 35) {
    insights.push("Heatwave alert: Stay hydrated and avoid outdoor activities between 11 AM and 3 PM.");
    insights.push("Recommended: light cotton clothing.");
  } else if (weather.temp < 10) {
    insights.push("Cold weather detected: Wear a heavy jacket or coat.");
  } else if (weather.temp >= 15 && weather.temp <= 25) {
    insights.push("Ideal weather conditions for travel and outdoor activities today.");
  }

  // Rain logic
  if (weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('drizzle')) {
    insights.push("Heavy rainfall expected. Carry an umbrella and expect traffic delays.");
  } else if (weather.condition.toLowerCase().includes('thunderstorm')) {
    insights.push("Storm alert: Stay indoors, severe thunderstorm approaching.");
  }

  // Air Quality
  if (aqi && aqi > 100) {
    insights.push("Air quality is unhealthy for sensitive groups. Consider wearing a mask outdoors.");
    insights.push("Jogging conditions are unsafe due to AQI.");
  }

  // UV Index
  if (uvi && uvi > 6) {
    insights.push("High UV exposure detected. Sunscreen (SPF 30+) recommended.");
  }

  // Visibility
  if (weather.visibility < 1000) {
    insights.push("Low visibility conditions may affect driving. Proceed with caution.");
  }

  if (insights.length === 0) {
    insights.push("Conditions are generally stable and comfortable.");
  }

  return insights;
};

exports.getCurrentWeather = async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    let url = '';
    
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    } else {
      return res.status(400).json({ success: false, error: 'City or coordinates required' });
    }

    const response = await axios.get(url);
    const data = response.data;

    // Fetch Air Pollution & UVI data requires coords
    const latCoord = data.coord.lat;
    const lonCoord = data.coord.lon;

    // Get AQI
    let aqi = null;
    try {
      const aqiRes = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${latCoord}&lon=${lonCoord}&appid=${API_KEY}`);
      aqi = aqiRes.data.list[0].components.pm2_5; // simplistic AQI representation
    } catch(e) { console.error('AQI Error', e.message); }

    const weatherSummary = {
      location: `${data.name}, ${data.sys.country}`,
      coordinates: data.coord,
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      condition: data.weather[0].description,
      icon: data.weather[0].icon,
      visibility: data.visibility,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset
    };

    const aiRecommendations = generateAIInsights(weatherSummary, aqi, 5); // using mock 5 for UVI since normal endpoint doesn't return UVI anymore

    res.json({
      success: true,
      data: {
        ...weatherSummary,
        aqi,
        uvIndex: 5,
        aiRecommendations
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data?.message || 'Failed to fetch weather data' });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    let url = '';

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    }

    const response = await axios.get(url);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch forecast' });
  }
};

exports.saveSearch = async (req, res) => {
  try {
    const historyData = {
      ...req.body,
      user: req.user._id
    };
    const history = await SearchHistory.create(historyData);
    res.status(201).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id }).sort({ timestamp: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateHistoryNote = async (req, res) => {
  try {
    const history = await SearchHistory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { notes: req.body.notes },
      { new: true, runValidators: true }
    );
    if (!history) {
      return res.status(404).json({ success: false, error: 'Weather log not found or unauthorized' });
    }
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteHistory = async (req, res) => {
  try {
    const history = await SearchHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!history) {
      return res.status(404).json({ success: false, error: 'Weather log not found or unauthorized' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.exportHistory = async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const history = await SearchHistory.find({ user: req.user._id }).lean();
    
    if (format === 'csv') {
      if (history.length === 0) {
        res.header('Content-Type', 'text/csv');
        res.attachment('weather_history.csv');
        return res.send('Location,Temperature,Condition,Humidity,WindSpeed,AQI,UVIndex,Notes,Timestamp\r\n');
      }

      const csvRows = [];
      // Headers
      csvRows.push(['Location', 'Temperature (°C)', 'Condition', 'Humidity (%)', 'Wind Speed (m/s)', 'AQI', 'UV Index', 'Notes', 'Timestamp'].join(','));
      
      for (const row of history) {
        const details = row.weatherDetails || {};
        const timestamp = new Date(row.timestamp).toLocaleString();
        const csvLine = [
          `"${row.location.replace(/"/g, '""')}"`,
          details.temperature ?? '',
          `"${(details.condition || '').replace(/"/g, '""')}"`,
          details.humidity ?? '',
          details.windSpeed ?? '',
          details.aqi ?? '',
          details.uvIndex ?? '',
          `"${(row.notes || '').replace(/"/g, '""')}"`,
          `"${timestamp}"`
        ];
        csvRows.push(csvLine.join(','));
      }
      
      res.header('Content-Type', 'text/csv');
      res.attachment('weather_history.csv');
      return res.send(csvRows.join('\r\n'));
    }
    
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

