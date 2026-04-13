const REQUIRED_FIELDS = ['phone_raw', 'display_name', 'message_text', 'timestamp', 'source'];

function validateClientIdentificationPayload(payload) {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    return payload[field] === undefined || payload[field] === null || payload[field] === '';
  });

  return {
    ok: missingFields.length === 0,
    missingFields
  };
}

module.exports = {
  REQUIRED_FIELDS,
  validateClientIdentificationPayload
};
