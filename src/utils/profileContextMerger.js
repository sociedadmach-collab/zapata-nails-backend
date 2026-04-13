function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function mergeIntentIntoProfileContext({ clientRecord, intentData }) {
  const mergedContext = {
    ...(clientRecord || {})
  };

  if (!hasValue(mergedContext.service_interest) && hasValue(intentData?.service_interest)) {
    mergedContext.service_interest = intentData.service_interest;
  }

  if (!hasValue(mergedContext.zone) && hasValue(intentData?.location_hint)) {
    mergedContext.zone = intentData.location_hint;
  }

  return mergedContext;
}

module.exports = {
  mergeIntentIntoProfileContext
};
