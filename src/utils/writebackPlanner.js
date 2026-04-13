function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isSafeZone(value) {
  const normalized = String(value || '').trim();

  if (normalized.length < 3) {
    return false;
  }

  if (/^\d+$/.test(normalized)) {
    return false;
  }

  const lower = normalized.toLowerCase();
  const invalidPlaceholders = ['n/a', 'na', 'none', 'null', 'undefined', '-', '--', '...'];

  return !invalidPlaceholders.includes(lower);
}

function planWriteback({
  clientRecord,
  intentData,
  resolvedServiceKey,
  resolvedServiceData,
  enrichedProfileContext
}) {
  const record = clientRecord || {};
  const fieldsToWrite = {};

  if (
    !hasValue(record.service_interest) &&
    resolvedServiceKey &&
    resolvedServiceData?.display_name &&
    hasValue(enrichedProfileContext?.service_interest)
  ) {
    fieldsToWrite.service_interest = resolvedServiceData.display_name;
  }

  if (
    !hasValue(record.zone) &&
    hasValue(intentData?.location_hint) &&
    isSafeZone(intentData.location_hint)
  ) {
    fieldsToWrite.zone = String(intentData.location_hint).trim();
  }

  return {
    shouldWrite: Object.keys(fieldsToWrite).length > 0,
    fieldsToWrite
  };
}

module.exports = {
  planWriteback
};
