const { checkClientExistsByPhone } = require('../services/checkClientService');

async function handleCheckClient(req, res) {
  try {
    const phone = req.body?.phone;

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        ok: false,
        error: 'phone is required'
      });
    }

    const result = await checkClientExistsByPhone(phone);

    return res.status(200).json({
      ok: true,
      exists: result.exists
    });
  } catch (error) {
    console.error('Check client error:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
}

module.exports = {
  handleCheckClient
};
