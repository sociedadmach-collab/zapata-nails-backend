const express = require('express');
const router = express.Router();

const { handleBookingConfirmation } = require('../controllers/bookingController');

router.post('/booking-confirmation', handleBookingConfirmation);

module.exports = router;