const { UCHAT_RESPONSE_FIELDS } = require('../constants/uchatResponseFields');

function formatUchatResponse(body) {
  const source = body || {};

  return {
    [UCHAT_RESPONSE_FIELDS.generated_message]: source.generated_message || null,
    [UCHAT_RESPONSE_FIELDS.next_profile_step]: source.next_profile_step || null,
    [UCHAT_RESPONSE_FIELDS.sales_route]: source.sales_route || null,
    [UCHAT_RESPONSE_FIELDS.closing_strategy]: source.closing_strategy || null,
    [UCHAT_RESPONSE_FIELDS.coverage_status]: source.coverage_status || 'unknown',
    [UCHAT_RESPONSE_FIELDS.should_continue_automation]:
      source.should_continue_automation === true,
    [UCHAT_RESPONSE_FIELDS.requires_manual_review]:
      source.requires_manual_review === true,
    [UCHAT_RESPONSE_FIELDS.client_status]: source.client_status || null,
    [UCHAT_RESPONSE_FIELDS.profile_status]: source.profile_status || null,
    [UCHAT_RESPONSE_FIELDS.resolved_service_key]: source.resolved_service_key || null,
    [UCHAT_RESPONSE_FIELDS.display_price]: source.display_price || null,
    [UCHAT_RESPONSE_FIELDS.writeback_applied]: source.writeback_applied === true,
    [UCHAT_RESPONSE_FIELDS.loyalty_signals]: {
      is_vip_client: source.loyalty_signals?.is_vip_client === true,
      birthday_known: source.loyalty_signals?.birthday_known === true,
      birthday_upcoming: source.loyalty_signals?.birthday_upcoming === true,
      favorite_service_known: source.loyalty_signals?.favorite_service_known === true,
      reactivation_candidate: source.loyalty_signals?.reactivation_candidate === true
    },
    [UCHAT_RESPONSE_FIELDS.message_key]: source.message_key || null
  };
}

module.exports = {
  formatUchatResponse
};
