function normalizeSpanishPhone(phoneRaw) {
  if (!phoneRaw) {
    return '';
  }

  const sanitized = String(phoneRaw).trim().replace(/[^\d+]/g, '');
  const digitsOnly = sanitized.replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  if (digitsOnly.startsWith('0034') && digitsOnly.length === 13) {
    return `+${digitsOnly.slice(2)}`;
  }

  if (digitsOnly.startsWith('34') && digitsOnly.length === 11) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 9) {
    return `+34${digitsOnly}`;
  }

  return sanitized.startsWith('+') ? sanitized : `+${digitsOnly}`;
}

function isValidSpanishMobilePhone(phoneNormalized) {
  return /^\+34[67]\d{8}$/.test(phoneNormalized);
}

module.exports = {
  normalizeSpanishPhone,
  isValidSpanishMobilePhone
};
