const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Export mapping under /api/export
router.get('/', exportController.exportQueries);

module.exports = router;
