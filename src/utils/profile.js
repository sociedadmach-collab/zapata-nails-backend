const { env } = require('../config/env');

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function evaluateProfileStatus(clientRecord) {
  if (!clientRecord) {
    return 'INCOMPLETE';
  }

  const missingRequiredFields = env.clientRequiredFields.filter((field) => {
    return !hasValue(clientRecord[field]);
  });

  if (missingRequiredFields.length > 0) {
    return 'INCOMPLETE';
  }

  const missingOptionalFields = env.clientOptionalFields.filter((field) => {
    return !hasValue(clientRecord[field]);
  });

  // birthdate is treated as a loyalty/enrichment signal, not as a required field.
  // If it exists in the sheet and is present, it helps the profile move toward COMPLETE.
  if (missingOptionalFields.length === 0) {
    return 'COMPLETE';
  }

  return 'PARTIAL';
}

module.exports = {
  evaluateProfileStatus
};
