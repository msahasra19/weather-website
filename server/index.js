const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const weatherRoutes = require('./routes/weather');
const queriesRoutes = require('./routes/queries');
const exportRoutes = require('./routes/export');
const youtubeRoutes = require('./routes/youtube');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route Mounts
app.use('/api/weather', weatherRoutes);
app.use('/api/queries', queriesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/auth', authRoutes);

// Server Root Status Check
app.get('/', (req, res) => {
  res.json({
    app: 'WeatherIQ Premium Full-Stack API',
    status: 'operational',
    time: new Date()
  });
});

// Bind Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weatherapp';

// Graceful Database Connection Bootstrapper
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection failed!', err.message);
    console.warn('Bootstrapping server in OFFLINE/MOCKED mode to prevent complete system crash...');
    
    // Listen even if MongoDB fails (offline/degraded operation support)
    app.listen(PORT, () => {
      console.log(`Degraded Server running on port ${PORT} (without active MongoDB connection)`);
    });
  });

module.exports = app;
