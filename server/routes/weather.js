const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Route mapping for Current Weather and 5-Day Forecast
router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecast);

module.exports = router;
