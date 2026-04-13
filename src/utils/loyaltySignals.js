function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function buildDefaultSignals() {
  return {
    isVipClient: false,
    birthdayKnown: false,
    birthdayUpcoming: false,
    favoriteServiceKnown: false,
    reactivationCandidate: false
  };
}

function normalizeDate(value) {
  if (!hasValue(value)) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isBirthdayWithinNext30Days(birthdateValue, processedAtValue) {
  const birthdate = normalizeDate(birthdateValue);
  const processedAt = normalizeDate(processedAtValue);

  if (!birthdate || !processedAt) {
    return false;
  }

  const currentYear = processedAt.getUTCFullYear();
  const nextBirthday = new Date(
    Date.UTC(currentYear, birthdate.getUTCMonth(), birthdate.getUTCDate())
  );

  if (Number.isNaN(nextBirthday.getTime())) {
    return false;
  }

  if (nextBirthday < processedAt) {
    nextBirthday.setUTCFullYear(currentYear + 1);
  }

  const diffMs = nextBirthday.getTime() - processedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 30;
}

function isOlderThan45Days(lastVisitValue, processedAtValue) {
  const lastVisit = normalizeDate(lastVisitValue);
  const processedAt = normalizeDate(processedAtValue);

  if (!lastVisit || !processedAt) {
    return false;
  }

  const diffMs = processedAt.getTime() - lastVisit.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > 45;
}

function deriveLoyaltySignals({ clientRecord, processedAt }) {
  if (!clientRecord) {
    return buildDefaultSignals();
  }

  return {
    isVipClient: String(clientRecord.vip_status || '').trim().toUpperCase() === 'VIP',
    birthdayKnown: hasValue(clientRecord.birthdate),
    birthdayUpcoming: isBirthdayWithinNext30Days(clientRecord.birthdate, processedAt),
    favoriteServiceKnown: hasValue(clientRecord.service_interest),
    reactivationCandidate: isOlderThan45Days(clientRecord.last_visit, processedAt)
  };
}

module.exports = {
  deriveLoyaltySignals
};
