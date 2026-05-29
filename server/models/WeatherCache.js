const mongoose = require('mongoose');

const WeatherCacheSchema = new mongoose.Schema({
  location: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour TTL index in seconds
  }
});

// Compound index on lat/lon to search by nearby coordinate coordinates if needed
WeatherCacheSchema.index({ lat: 1, lon: 1 });

module.exports = mongoose.model('WeatherCache', WeatherCacheSchema);
