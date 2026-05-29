const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const protect = require('../middleware/auth');

// Get current weather by city or coords (Public endpoints)
router.get('/current', weatherController.getCurrentWeather);

// Get 5-day forecast (Public endpoint)
router.get('/forecast', weatherController.getForecast);

// CRUD for history (Protected endpoints)
router.post('/history', protect, weatherController.saveSearch);
router.get('/history', protect, weatherController.getHistory);
router.put('/history/:id', protect, weatherController.updateHistoryNote);
router.delete('/history/:id', protect, weatherController.deleteHistory);

// Export history (Protected endpoint)
router.get('/export', protect, weatherController.exportHistory);

module.exports = router;
