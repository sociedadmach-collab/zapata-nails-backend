const {
  registerClientFromText,
  validateRegisterClientFromTextPayload
} = require('../services/registerClientFromTextService');

async function handleRegisterClientFromText(req, res) {
  try {
    const validation = validateRegisterClientFromTextPayload(req.body || {});

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: 'missing_required_fields'
      });
    }

    const result = await registerClientFromText(req.body);

    if (result.exists) {
      return res.status(200).json({
        ok: true,
        created: false,
        exists: true
      });
    }

    if (result.invalidFormat) {
      return res.status(400).json({
        ok: false,
        error: 'invalid_format'
      });
    }

    return res.status(201).json({
      ok: true,
      created: true,
      exists: false,
      parsed: result.parsed
    });
  } catch (error) {
    console.error('Register client from text error:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
}

module.exports = {
  handleRegisterClientFromText
};
