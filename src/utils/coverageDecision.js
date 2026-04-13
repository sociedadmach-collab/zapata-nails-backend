const { normalizeText } = require('./zoneResolver');

const OUT_OF_AREA_CITIES = [
  'madrid',
  'barcelona',
  'sevilla',
  'malaga',
  'bilbao',
  'zaragoza',
  'alicante',
  'murcia'
];
const AMBIGUITY_MARKERS = [
  'cerca de',
  'por ahi',
  'zona norte',
  'zona sur',
  'zona este',
  'zona oeste'
];

function containsWholePhrase(text, phrase) {
  return new RegExp(`(^|\\s)${phrase.replace(/\s+/g, '\\s+')}($|\\s)`, 'i').test(text);
}

function determineCoverageDecision({ resolvedZone, locationHint }) {
  const normalizedHint = normalizeText(locationHint);
  const safeResolvedZone = resolvedZone || null;

  if (safeResolvedZone?.withinServiceArea === true) {
    return {
      coverageStatus: 'covered',
      shouldContinueAutomation: true,
      requiresManualReview: false
    };
  }

  if (normalizedHint) {
    const outOfAreaMatch = OUT_OF_AREA_CITIES.find((city) =>
      containsWholePhrase(normalizedHint, normalizeText(city))
    );

    if (outOfAreaMatch) {
      return {
        coverageStatus: 'out_of_area',
        shouldContinueAutomation: false,
        requiresManualReview: true
      };
    }

    return {
      coverageStatus: 'unknown',
      shouldContinueAutomation: true,
      requiresManualReview: false
    };
  }

  return {
    coverageStatus: 'unknown',
    shouldContinueAutomation: true,
    requiresManualReview: false
  };
}

module.exports = {
  determineCoverageDecision
};
