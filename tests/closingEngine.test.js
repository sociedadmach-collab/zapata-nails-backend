const { determineClosingStrategy } = require('../src/utils/closingEngine');
const { CLOSING_STRATEGY } = require('../src/constants/closingStrategies');
const { SALES_ROUTE } = require('../src/constants/salesRoutes');

describe('closingEngine', () => {
  test('out_of_area uses manual review safe', () => {
    const result = determineClosingStrategy({
      clientStatus: 'EXISTING',
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE,
      nextProfileStep: 'ready_to_book',
      resolvedServiceKey: 'soft_gel',
      coverageStatus: 'out_of_area',
      loyaltySignals: {},
      intentData: {},
      enrichedProfileContext: {}
    });

    expect(result.closing_strategy).toBe(CLOSING_STRATEGY.CLOSE_MANUAL_REVIEW_SAFE);
  });

  test('ask_birthdate uses birthdate enrichment soft', () => {
    const result = determineClosingStrategy({
      clientStatus: 'EXISTING',
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_PROFILE_COMPLETION,
      nextProfileStep: 'ask_birthdate',
      resolvedServiceKey: null,
      coverageStatus: 'covered',
      loyaltySignals: {},
      intentData: {},
      enrichedProfileContext: {}
    });

    expect(result.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_BIRTHDATE_ENRICHMENT_SOFT
    );
  });

  test('existing direct sale uses fast track', () => {
    const result = determineClosingStrategy({
      clientStatus: 'EXISTING',
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE,
      nextProfileStep: 'ready_to_book',
      resolvedServiceKey: null,
      coverageStatus: 'covered',
      loyaltySignals: {},
      intentData: {},
      enrichedProfileContext: {}
    });

    expect(result.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_EXISTING_CLIENT_FAST_TRACK
    );
  });

  test('individual service resolved uses combo upgrade', () => {
    const result = determineClosingStrategy({
      clientStatus: 'NEW',
      salesRoute: SALES_ROUTE.ROUTE_NEW_ONBOARDING,
      nextProfileStep: 'ask_zone',
      resolvedServiceKey: 'soft_gel',
      coverageStatus: 'covered',
      loyaltySignals: {},
      intentData: {},
      enrichedProfileContext: {}
    });

    expect(result.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_SERVICE_TO_COMBO_UPGRADE
    );
  });

  test('reactivation candidate uses reactivation soft', () => {
    const result = determineClosingStrategy({
      clientStatus: 'EXISTING',
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_PROFILE_COMPLETION,
      nextProfileStep: 'ask_service',
      resolvedServiceKey: null,
      coverageStatus: 'covered',
      loyaltySignals: { reactivationCandidate: true },
      intentData: {},
      enrichedProfileContext: {}
    });

    expect(result.closing_strategy).toBe(CLOSING_STRATEGY.CLOSE_REACTIVATION_SOFT);
  });

  test('default uses new client soft', () => {
    const result = determineClosingStrategy({
      clientStatus: 'NEW',
      salesRoute: SALES_ROUTE.ROUTE_NEW_ONBOARDING,
      nextProfileStep: 'ask_name',
      resolvedServiceKey: null,
      coverageStatus: 'unknown',
      loyaltySignals: { reactivationCandidate: false },
      intentData: {},
      enrichedProfileContext: {}
    });

    expect(result.closing_strategy).toBe(CLOSING_STRATEGY.CLOSE_NEW_CLIENT_SOFT);
  });
});
