const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');

// REST Routing CRUD mapped under /api/queries
router.post('/', queryController.createQuery);
router.get('/', queryController.getQueries);
router.get('/:id', queryController.getQueryById);
router.put('/:id', queryController.updateQuery);
router.delete('/:id', queryController.deleteQuery);

module.exports = router;
