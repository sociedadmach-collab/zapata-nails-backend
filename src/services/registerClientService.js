const { appendClientRecord } = require('./googleSheetsService');
const {
  checkClientExistsByPhone,
  normalizePhoneForLookup
} = require('./checkClientService');

function validateRegisterClientPayload(payload) {
  const requiredFields = ['name', 'phone', 'address', 'birthday'];

  const hasMissingFields = requiredFields.some((field) => {
    return !payload?.[field] || !String(payload[field]).trim();
  });

  return {
    ok: !hasMissingFields
  };
}

async function registerClient(payload) {
  const phoneNormalized = normalizePhoneForLookup(payload.phone);
  const existingClient = await checkClientExistsByPhone(phoneNormalized);

  if (existingClient.exists) {
    return {
      created: false,
      exists: true
    };
  }

  const clientRecord = {
  name: payload.name,
  display_name: payload.name,
  phone_normalized: phoneNormalized,
  address: payload.address,
  birthdate: payload.birthday
};

  await appendClientRecord(clientRecord);

  return {
    created: true,
    exists: false
  };
}

module.exports = {
  registerClient,
  validateRegisterClientPayload
};
