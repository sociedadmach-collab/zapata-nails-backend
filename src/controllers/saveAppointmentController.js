const {
  saveAppointment,
  validateSaveAppointmentPayload
} = require('../services/saveAppointmentService');

async function handleSaveAppointment(req, res) {
  try {
    const validation = validateSaveAppointmentPayload(req.body || {});

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: 'missing_required_fields'
      });
    }

    const result = await saveAppointment(req.body);

    if (!result.clientFound) {
      return res.status(404).json({
        ok: false,
        error: 'client_not_found'
      });
    }

    return res.status(201).json({
      ok: true,
      saved: true,
      appointment_id: result.appointment.appointment_id,
      client_name: result.appointment.client_name,
      address: result.appointment.address
    });
  } catch (error) {
    console.error('Save appointment error:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
}

module.exports = {
  handleSaveAppointment
};
