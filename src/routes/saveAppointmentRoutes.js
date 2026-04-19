const express = require('express');

const { handleSaveAppointment } = require('../controllers/saveAppointmentController');

const router = express.Router();

router.post('/save-appointment', handleSaveAppointment);

module.exports = router;
