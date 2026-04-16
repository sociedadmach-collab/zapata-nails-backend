const { appendClientRecord } = require('./googleSheetsService');
const {
  checkClientExistsByPhone,
  normalizePhoneForLookup
} = require('./checkClientService');

function validateRegisterClientFromTextPayload(payload) {
  const requiredFields = ['phone', 'raw_text'];

  const hasMissingFields = requiredFields.some((field) => {
    return !payload?.[field] || !String(payload[field]).trim();
  });

  return {
    ok: !hasMissingFields
  };
}

function parseClientRegistrationText(rawText) {
  const parts = String(rawText || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const [name, address, birthdate] = parts;

  if (!name || !address || !birthdate) {
    return null;
  }

  return {
    name,
    address,
    birthdate
  };
}

async function registerClientFromText(payload) {
  const phoneNormalized = normalizePhoneForLookup(payload.phone);
  const existingClient = await checkClientExistsByPhone(phoneNormalized);

  if (existingClient.exists) {
    return {
      created: false,
      exists: true,
      parsed: null
    };
  }

  const parsed = parseClientRegistrationText(payload.raw_text);

  if (!parsed) {
    return {
      created: false,
      exists: false,
      parsed: null,
      invalidFormat: true
    };
  }

  await appendClientRecord({
    name: parsed.name,
    display_name: parsed.name,
    phone_normalized: phoneNormalized,
    address: parsed.address,
    birthdate: parsed.birthdate
  });

  return {
    created: true,
    exists: false,
    parsed
  };
}

module.exports = {
  registerClientFromText,
  validateRegisterClientFromTextPayload,
  parseClientRegistrationText
};
