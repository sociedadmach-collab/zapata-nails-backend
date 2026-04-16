const {
  registerClient,
  validateRegisterClientPayload
} = require('../services/registerClientService');

async function handleRegisterClient(req, res) {
  try {
    const validation = validateRegisterClientPayload(req.body || {});

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: 'missing_required_fields'
      });
    }

    const result = await registerClient(req.body);

    if (result.exists) {
      return res.status(200).json({
        ok: true,
        created: false,
        exists: true
      });
    }

    return res.status(201).json({
      ok: true,
      created: true,
      exists: false
    });
  } catch (error) {
    console.error('Register client error:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
}

module.exports = {
  handleRegisterClient
};
