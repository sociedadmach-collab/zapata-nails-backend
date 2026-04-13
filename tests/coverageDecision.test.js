const { determineCoverageDecision } = require('../src/utils/coverageDecision');

describe('coverageDecision', () => {
  test('returns covered for Valencia', () => {
    expect(
      determineCoverageDecision({
        resolvedZone: null,
        locationHint: 'Valencia'
      })
    ).toEqual({
      coverageStatus: 'covered',
      shouldContinueAutomation: true,
      requiresManualReview: false
    });
  });

  test('prefers resolvedZone when available', () => {
    expect(
      determineCoverageDecision({
        resolvedZone: {
          key: 'la_eliana',
          displayName: 'La Eliana',
          withinServiceArea: true
        },
        locationHint: 'zona norte'
      })
    ).toEqual({
      coverageStatus: 'covered',
      shouldContinueAutomation: true,
      requiresManualReview: false
    });
  });

  test('returns covered for La Eliana', () => {
    expect(
      determineCoverageDecision({
        resolvedZone: null,
        locationHint: 'La Eliana'
      })
    ).toEqual({
      coverageStatus: 'covered',
      shouldContinueAutomation: true,
      requiresManualReview: false
    });
  });

  test('returns out_of_area for Madrid', () => {
    expect(
      determineCoverageDecision({
        resolvedZone: null,
        locationHint: 'Madrid'
      })
    ).toEqual({
      coverageStatus: 'out_of_area',
      shouldContinueAutomation: false,
      requiresManualReview: true
    });
  });

  test('returns out_of_area for Barcelona', () => {
    expect(
      determineCoverageDecision({
        resolvedZone: null,
        locationHint: 'Barcelona'
      })
    ).toEqual({
      coverageStatus: 'out_of_area',
      shouldContinueAutomation: false,
      requiresManualReview: true
    });
  });

  test('returns unknown for ambiguous area', () => {
    expect(
      determineCoverageDecision({
        resolvedZone: null,
        locationHint: 'zona norte'
      })
    ).toEqual({
      coverageStatus: 'unknown',
      shouldContinueAutomation: true,
      requiresManualReview: false
    });
  });
});
