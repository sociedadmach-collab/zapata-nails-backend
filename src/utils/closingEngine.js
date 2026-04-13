const { SALES_ROUTE } = require('../constants/salesRoutes');
const { CLOSING_STRATEGY } = require('../constants/closingStrategies');
const { CLOSING_SCRIPT_PROFILES } = require('../constants/closingScriptProfiles');
const { SERVICE_CATALOG } = require('../constants/serviceCatalog');

function buildClosingDecision(strategy) {
  return {
    closing_strategy: strategy,
    closing_script_profile: CLOSING_SCRIPT_PROFILES[strategy]
  };
}

function isIndividualService(serviceKey) {
  if (!serviceKey || !SERVICE_CATALOG[serviceKey]) {
    return false;
  }

  return SERVICE_CATALOG[serviceKey].category !== 'combo';
}

function determineClosingStrategy({
  clientStatus,
  salesRoute,
  nextProfileStep,
  resolvedServiceKey,
  coverageStatus,
  loyaltySignals
}) {
  if (coverageStatus === 'out_of_area') {
    return buildClosingDecision(CLOSING_STRATEGY.CLOSE_MANUAL_REVIEW_SAFE);
  }

  if (
    salesRoute === SALES_ROUTE.ROUTE_DUPLICATE_SAFE_FALLBACK ||
    salesRoute === SALES_ROUTE.ROUTE_TECHNICAL_FALLBACK ||
    salesRoute === SALES_ROUTE.ROUTE_INVALID_PHONE_FALLBACK ||
    salesRoute === SALES_ROUTE.ROUTE_OUT_OF_COVERAGE
  ) {
    return buildClosingDecision(CLOSING_STRATEGY.CLOSE_MANUAL_REVIEW_SAFE);
  }

  if (nextProfileStep === 'ask_birthdate') {
    return buildClosingDecision(CLOSING_STRATEGY.CLOSE_BIRTHDATE_ENRICHMENT_SOFT);
  }

  if (
    clientStatus === 'EXISTING' &&
    salesRoute === SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE
  ) {
    return buildClosingDecision(CLOSING_STRATEGY.CLOSE_EXISTING_CLIENT_FAST_TRACK);
  }

  if (isIndividualService(resolvedServiceKey)) {
    return buildClosingDecision(CLOSING_STRATEGY.CLOSE_SERVICE_TO_COMBO_UPGRADE);
  }

  if (loyaltySignals?.reactivationCandidate === true) {
    return buildClosingDecision(CLOSING_STRATEGY.CLOSE_REACTIVATION_SOFT);
  }

  return buildClosingDecision(CLOSING_STRATEGY.CLOSE_NEW_CLIENT_SOFT);
}

module.exports = {
  determineClosingStrategy
};
