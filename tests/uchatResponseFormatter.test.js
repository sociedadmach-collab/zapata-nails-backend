const { formatUchatResponse } = require('../src/utils/uchatResponseFormatter');

describe('uchatResponseFormatter', () => {
  test('returns compact UChat payload with stable fields only', () => {
    const result = formatUchatResponse({
      generated_message: 'Hola hermosa',
      next_profile_step: 'ask_service',
      sales_route: 'ROUTE_NEW_ONBOARDING',
      closing_strategy: 'CLOSE_NEW_CLIENT_SOFT',
      coverage_status: 'covered',
      should_continue_automation: true,
      requires_manual_review: false,
      client_status: 'NEW',
      profile_status: 'INCOMPLETE',
      resolved_service_key: 'soft_gel',
      display_price: '35.99€',
      writeback_applied: true,
      loyalty_signals: {
        is_vip_client: true,
        birthday_known: false,
        birthday_upcoming: false,
        favorite_service_known: true,
        reactivation_candidate: false
      },
      message_key: 'new_client_welcome_v1',
      closing_script_profile: { goal: 'should not leak' },
      enriched_profile_context: { zone: 'Valencia' }
    });

    expect(result).toEqual({
      generated_message: 'Hola hermosa',
      next_profile_step: 'ask_service',
      sales_route: 'ROUTE_NEW_ONBOARDING',
      closing_strategy: 'CLOSE_NEW_CLIENT_SOFT',
      coverage_status: 'covered',
      should_continue_automation: true,
      requires_manual_review: false,
      client_status: 'NEW',
      profile_status: 'INCOMPLETE',
      resolved_service_key: 'soft_gel',
      display_price: '35.99€',
      writeback_applied: true,
      loyalty_signals: {
        is_vip_client: true,
        birthday_known: false,
        birthday_upcoming: false,
        favorite_service_known: true,
        reactivation_candidate: false
      },
      message_key: 'new_client_welcome_v1'
    });
  });
});
