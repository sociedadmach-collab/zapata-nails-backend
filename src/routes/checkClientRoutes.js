const express = require('express');

const { handleCheckClient } = require('../controllers/checkClientController');

const router = express.Router();

router.post('/check-client', handleCheckClient);

module.exports = router;
