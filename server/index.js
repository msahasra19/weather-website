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

// Graceful Database Connection Bootstrapper (Asynchronous)
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  // ensure we don't buffer indefinitely if the connection drops
  socketTimeoutMS: 45000, 
})
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    // ONLY listen if running locally (not in serverless production on Vercel)
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running in development mode on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection failed!', err.message);
    console.warn('Could not connect to the database. Exiting...');
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
  });

module.exports = app;
