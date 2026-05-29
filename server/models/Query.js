const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  resolvedCity: {
    type: String
  },
  lat: {
    type: Number
  },
  lon: {
    type: Number
  },
  dateFrom: {
    type: Date,
    required: true
  },
  dateTo: {
    type: Date,
    required: true
  },
  weatherData: {
    type: Array,
    default: []
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Auto-update the updatedAt field on updates
QuerySchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Query', QuerySchema);
