const express = require('express');
const { handleClientIdentification } = require('../controllers/clientIdentificationController');

const router = express.Router();

router.post('/webhooks/client-identification', handleClientIdentification);

module.exports = router;
