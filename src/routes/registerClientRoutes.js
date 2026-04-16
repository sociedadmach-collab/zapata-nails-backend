const express = require('express');

const { handleRegisterClient } = require('../controllers/registerClientController');

const router = express.Router();

router.post('/register-client', handleRegisterClient);

module.exports = router;
