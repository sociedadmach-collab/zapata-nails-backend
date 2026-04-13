const { CLIENT_STATUS, PROFILE_STATUS } = require('../constants/clientStatus');
const { NEXT_ROUTE } = require('../constants/routes');

function determineNextRoute({ clientStatus, profileStatus, hasTechnicalError = false }) {
  if (hasTechnicalError || clientStatus === CLIENT_STATUS.ERROR) {
    return NEXT_ROUTE.TECHNICAL_FALLBACK;
  }

  if (clientStatus === CLIENT_STATUS.DUPLICATE) {
    return NEXT_ROUTE.MANUAL_REVIEW_FALLBACK;
  }

  if (clientStatus === CLIENT_STATUS.NEW) {
    return NEXT_ROUTE.NEW_CLIENT_ONBOARDING;
  }

  if (clientStatus === CLIENT_STATUS.EXISTING && profileStatus === PROFILE_STATUS.COMPLETE) {
    return NEXT_ROUTE.EXISTING_CLIENT_WELCOME;
  }

  if (
    clientStatus === CLIENT_STATUS.EXISTING &&
    [PROFILE_STATUS.PARTIAL, PROFILE_STATUS.INCOMPLETE].includes(profileStatus)
  ) {
    return NEXT_ROUTE.PROFILE_COMPLETION;
  }

  return NEXT_ROUTE.MANUAL_REVIEW_FALLBACK;
}

module.exports = {
  determineNextRoute
};
