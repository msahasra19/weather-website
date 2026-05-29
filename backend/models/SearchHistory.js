const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: Number,
    lon: Number
  },
  weatherDetails: {
    temperature: Number,
    condition: String,
    humidity: Number,
    windSpeed: Number,
    aqi: Number,
    uvIndex: Number
  },
  aiRecommendations: [String],
  notes: {
    type: String,
    default: ''
  },
  tags: [String],
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
