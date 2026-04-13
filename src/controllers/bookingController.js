const { generateBookingMessages } = require('../services/bookingConfirmationService');

async function handleBookingConfirmation(req, res) {
  try {
    const data = req.body;

    const messages = generateBookingMessages(data);

    return res.status(200).json({
      ok: true,
      confirmation_message: messages.confirmation_message,
      terms_message: messages.terms_message
    });
  } catch (error) {
    console.error('Booking confirmation error:', error.message);

    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
}

module.exports = {
  handleBookingConfirmation
};