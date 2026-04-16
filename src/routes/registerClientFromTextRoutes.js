const express = require('express');

const {
  handleRegisterClientFromText
} = require('../controllers/registerClientFromTextController');

const router = express.Router();

router.post('/register-client-from-text', handleRegisterClientFromText);

module.exports = router;
