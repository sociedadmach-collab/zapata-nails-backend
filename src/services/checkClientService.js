const { getClientSheetData } = require('./googleSheetsService');

function normalizePhoneForLookup(phone) {
  return String(phone || '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\+/g, '')
    .trim();
}

async function checkClientExistsByPhone(phone) {
  const normalizedPhone = normalizePhoneForLookup(phone);
  const { records } = await getClientSheetData();

  const exists = records.some((record) => {
    const candidatePhones = [
      record.phone_normalized,
      record.phone,
      record.phone_raw
    ].filter(Boolean);

    return candidatePhones.some((candidatePhone) => {
      return normalizePhoneForLookup(candidatePhone) === normalizedPhone;
    });
  });

  return {
    exists
  };
}

module.exports = {
  checkClientExistsByPhone,
  normalizePhoneForLookup
};
