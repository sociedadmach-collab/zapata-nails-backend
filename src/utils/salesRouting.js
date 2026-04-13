const { CLIENT_STATUS, PROFILE_STATUS } = require('../constants/clientStatus');
const { NEXT_ROUTE } = require('../constants/routes');
const { SALES_ROUTE } = require('../constants/salesRoutes');

function determineSalesRouting({
  clientStatus,
  profileStatus,
  nextRoute,
  persistenceOk,
  isPhoneValid
}) {
  if (isPhoneValid === false) {
    return {
      salesRoute: SALES_ROUTE.ROUTE_INVALID_PHONE_FALLBACK,
      conversationGoal: 'recover_contact_data',
      recommendedAction: 'request_valid_phone',
      messageKey: 'invalid_phone_fallback_v1'
    };
  }

  if (clientStatus === CLIENT_STATUS.NEW) {
    return {
      salesRoute: SALES_ROUTE.ROUTE_NEW_ONBOARDING,
      conversationGoal: 'capture_interest',
      recommendedAction: 'collect_service_interest',
      messageKey: 'new_client_welcome_v1'
    };
  }

  if (
    clientStatus === CLIENT_STATUS.EXISTING &&
    profileStatus !== PROFILE_STATUS.COMPLETE
  ) {
    return {
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_PROFILE_COMPLETION,
      conversationGoal: 'complete_profile',
      recommendedAction: 'complete_profile_then_offer',
      messageKey: 'existing_profile_completion_v1'
    };
  }

  if (
    clientStatus === CLIENT_STATUS.EXISTING &&
    profileStatus === PROFILE_STATUS.COMPLETE
  ) {
    return {
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE,
      conversationGoal: 'drive_booking',
      recommendedAction: 'direct_service_offer',
      messageKey: 'existing_direct_offer_v1'
    };
  }

  if (clientStatus === CLIENT_STATUS.DUPLICATE) {
    return {
      salesRoute: SALES_ROUTE.ROUTE_DUPLICATE_SAFE_FALLBACK,
      conversationGoal: 'avoid_wrong_automation',
      recommendedAction: 'safe_manual_recovery',
      messageKey: 'duplicate_safe_fallback_v1'
    };
  }

  if (
    clientStatus === CLIENT_STATUS.ERROR &&
    nextRoute === NEXT_ROUTE.TECHNICAL_FALLBACK
  ) {
    return {
      salesRoute: SALES_ROUTE.ROUTE_TECHNICAL_FALLBACK,
      conversationGoal: 'preserve_experience',
      recommendedAction: 'graceful_recovery',
      messageKey: 'technical_fallback_v1'
    };
  }

  return {
    salesRoute: SALES_ROUTE.ROUTE_DUPLICATE_SAFE_FALLBACK,
    conversationGoal: 'avoid_wrong_automation',
    recommendedAction: persistenceOk === false ? 'safe_manual_recovery' : 'safe_manual_recovery',
    messageKey: 'duplicate_safe_fallback_v1'
  };
}

module.exports = {
  determineSalesRouting
};
