const { identifyClient } = require('../services/clientIdentificationService');
const { validateClientIdentificationPayload } = require('../validators/clientIdentificationValidator');
const { CLIENT_STATUS, PROFILE_STATUS } = require('../constants/clientStatus');
const { NEXT_ROUTE } = require('../constants/routes');
const { ERROR_CODE } = require('../constants/errorCodes');

async function handleClientIdentification(req, res, next) {
  try {
    const payloadValidation = validateClientIdentificationPayload(req.body || {});

    if (!payloadValidation.ok) {
      return res.status(400).json({
        ok: false,
        request_id: null,
        client_status: CLIENT_STATUS.ERROR,
        profile_status: PROFILE_STATUS.INCOMPLETE,
        next_route: NEXT_ROUTE.TECHNICAL_FALLBACK,
        error_code: ERROR_CODE.INVALID_PAYLOAD,
        error_message: `Missing required fields: ${payloadValidation.missingFields.join(', ')}`
      });
    }

    const result = await identifyClient(req.body);
    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  handleClientIdentification
};
