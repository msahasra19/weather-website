const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const weatherRoutes = require('./routes/weatherRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/weather', weatherRoutes);
app.use('/api/auth', authRoutes);

// Base Health / Greeting Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the WeatherIQ AI REST API service',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
