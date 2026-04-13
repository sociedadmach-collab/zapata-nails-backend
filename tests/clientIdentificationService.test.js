jest.mock('../src/config/env', () => ({
  validateEnvironment: jest.fn()
}));

jest.mock('../src/services/googleSheetsService', () => ({
  createClient: jest.fn(),
  findClientsByPhone: jest.fn(),
  updateClient: jest.fn(),
  updateClientFields: jest.fn()
}));

jest.mock('../src/services/loggingService', () => ({
  logAutomationEvent: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/services/intentDetectionService', () => ({
  detectIntent: jest.fn().mockResolvedValue({
    service_interest: null,
    date_preference: null,
    time_preference: null,
    location_hint: null,
    has_previous_removal: null,
    design_interest: null,
    intent_type: 'booking'
  })
}));

jest.mock('../src/services/messageGenerationService', () => ({
  generateSalesMessage: jest.fn().mockResolvedValue({
    generatedMessage: 'Hola hermosa, te lo dejo listo.',
    messageStrategy: 'ai_generated',
    toneProfile: 'madaly_zapata_whatsapp',
    resolvedServiceKey: null,
    resolvedServiceData: null,
    displayPrice: { label: null, value: null }
  })
}));

const { validateEnvironment } = require('../src/config/env');
const {
  createClient,
  findClientsByPhone,
  updateClient,
  updateClientFields
} = require('../src/services/googleSheetsService');
const { identifyClient } = require('../src/services/clientIdentificationService');
const { CLIENT_STATUS, PROFILE_STATUS } = require('../src/constants/clientStatus');
const { NEXT_ROUTE } = require('../src/constants/routes');
const { ERROR_CODE } = require('../src/constants/errorCodes');
const { SALES_ROUTE } = require('../src/constants/salesRoutes');
const { CLOSING_STRATEGY } = require('../src/constants/closingStrategies');
const { detectIntent } = require('../src/services/intentDetectionService');
const { generateSalesMessage } = require('../src/services/messageGenerationService');

describe('clientIdentificationService', () => {
  const payload = {
    phone_raw: '612 34 56 78',
    display_name: 'Maria',
    message_text: 'Hola',
    timestamp: '2026-04-10T14:10:00Z',
    source: 'whatsapp'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validateEnvironment.mockReturnValue({ ok: true, missing: [], invalid: [], message: '' });
    createClient.mockResolvedValue(undefined);
    updateClient.mockResolvedValue(undefined);
    updateClientFields.mockResolvedValue(undefined);
  });

  test('returns NEW for unmatched valid phone', async () => {
    findClientsByPhone.mockResolvedValue([]);

    const result = await identifyClient(payload);

    expect(result.httpStatus).toBe(200);
    expect(result.body.client_status).toBe(CLIENT_STATUS.NEW);
    expect(result.body.profile_status).toBe(PROFILE_STATUS.INCOMPLETE);
    expect(result.body.next_route).toBe(NEXT_ROUTE.NEW_CLIENT_ONBOARDING);
    expect(result.body.persistence_ok).toBe(true);
    expect(result.body.persistence_action).toBe('create');
    expect(result.body.sales_route).toBe(SALES_ROUTE.ROUTE_NEW_ONBOARDING);
    expect(result.body.conversation_goal).toBe('capture_interest');
    expect(result.body.recommended_action).toBe('collect_service_interest');
    expect(result.body.message_key).toBe('new_client_welcome_v1');
    expect(result.body.next_profile_step).toBe('ask_service');
    expect(result.body.missing_required_fields).toContain('service_interest');
    expect(result.body.intent_data).toBeDefined();
    expect(result.body.enriched_profile_context).toEqual({});
    expect(result.body.generated_message).toBe('Hola hermosa, te lo dejo listo.');
    expect(result.body.message_strategy).toBe('ai_generated');
    expect(result.body.tone_profile).toBe('madaly_zapata_whatsapp');
    expect(result.body.resolved_service_key).toBeNull();
    expect(result.body.display_price).toBeNull();
    expect(result.body.writeback_applied).toBe(false);
    expect(result.body.writeback_fields).toEqual([]);
    expect(result.body.uchat_payload).toEqual({
      generated_message: 'Hola hermosa, te lo dejo listo.',
      next_profile_step: 'ask_service',
      sales_route: SALES_ROUTE.ROUTE_NEW_ONBOARDING,
      closing_strategy: CLOSING_STRATEGY.CLOSE_NEW_CLIENT_SOFT,
      coverage_status: 'unknown',
      should_continue_automation: true,
      requires_manual_review: false,
      client_status: CLIENT_STATUS.NEW,
      profile_status: PROFILE_STATUS.INCOMPLETE,
      resolved_service_key: null,
      display_price: null,
      writeback_applied: false,
      loyalty_signals: {
        is_vip_client: false,
        birthday_known: false,
        birthday_upcoming: false,
        favorite_service_known: false,
        reactivation_candidate: false
      },
      message_key: 'new_client_welcome_v1'
    });
    expect(result.body.closing_strategy).toBe(CLOSING_STRATEGY.CLOSE_NEW_CLIENT_SOFT);
    expect(result.body.closing_script_profile).toEqual({
      goal: 'build trust and move toward booking',
      message_intent: 'soft onboarding close',
      persuasion_angle: 'emotional care + spa at home',
      next_step_focus: 'ask one useful step only'
    });
    expect(result.body.loyalty_signals).toEqual({
      is_vip_client: false,
      birthday_known: false,
      birthday_upcoming: false,
      favorite_service_known: false,
      reactivation_candidate: false
    });
    expect(detectIntent).toHaveBeenCalledWith({ messageText: payload.message_text });
    expect(generateSalesMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        loyaltySignals: {
          isVipClient: false,
          birthdayKnown: false,
          birthdayUpcoming: false,
          favoriteServiceKnown: false,
          reactivationCandidate: false
        },
        closingStrategy: CLOSING_STRATEGY.CLOSE_NEW_CLIENT_SOFT
      })
    );
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(updateClient).not.toHaveBeenCalled();
  });

  test('applies writeback for NEW client with inferred service_interest', async () => {
    detectIntent.mockResolvedValueOnce({
      service_interest: 'soft gel',
      date_preference: null,
      time_preference: null,
      location_hint: null,
      has_previous_removal: null,
      design_interest: null,
      intent_type: 'booking'
    });
    generateSalesMessage.mockResolvedValueOnce({
      generatedMessage: 'Hola hermosa, Soft Gel te va a encantar. Su precio es 35.99€ y te lo dejo listo.',
      messageStrategy: 'ai_generated',
      toneProfile: 'madaly_zapata_whatsapp',
      resolvedServiceKey: 'soft_gel',
      resolvedServiceData: {
        display_name: 'Soft Gel',
        category: 'manicure',
        summary: 'Ligero, flexible y natural',
        benefits: ['acabado natural y elegante'],
        guarantee: null,
        notes: []
      },
      displayPrice: { label: 'precio', value: '35.99€' }
    });
    createClient.mockResolvedValueOnce({
      client_id: 'CL-20260410-120000-ABCD',
      phone_normalized: '+34612345678',
      display_name: 'Maria',
      __rowNumber: 2
    });
    updateClientFields.mockResolvedValueOnce({
      client_id: 'CL-20260410-120000-ABCD',
      phone_normalized: '+34612345678',
      display_name: 'Maria',
      service_interest: 'Soft Gel',
      __rowNumber: 2
    });
    findClientsByPhone.mockResolvedValue([]);

    const result = await identifyClient(payload);

    expect(result.body.intent_data.service_interest).toBe('soft gel');
    expect(result.body.enriched_profile_context.service_interest).toBe('Soft Gel');
    expect(result.body.next_profile_step).not.toBe('ask_service');
    expect(result.body.missing_required_fields).not.toContain('service_interest');
    expect(result.body.resolved_service_key).toBe('soft_gel');
    expect(result.body.display_price).toBe('35.99€');
    expect(result.body.writeback_applied).toBe(true);
    expect(result.body.writeback_fields).toContain('service_interest');
    expect(result.body.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_SERVICE_TO_COMBO_UPGRADE
    );
    expect(updateClientFields).toHaveBeenCalledTimes(1);
  });

  test('applies writeback for EXISTING client with empty zone and inferred location', async () => {
    detectIntent.mockResolvedValueOnce({
      service_interest: 'soft gel',
      date_preference: null,
      time_preference: null,
      location_hint: 'Valencia',
      has_previous_removal: null,
      design_interest: null,
      intent_type: 'booking'
    });
    updateClientFields.mockResolvedValueOnce({
      phone_normalized: '+34612345678',
        display_name: 'Maria',
        email: '',
        last_visit: '2026-03-01',
        notes: '',
        zone: 'Valencia',
        __rowNumber: 2
    });
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        email: '',
        last_visit: '2026-03-01',
        notes: '',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.enriched_profile_context.zone).toBe('Valencia');
    expect(result.body.coverage_status).toBe('covered');
    expect(result.body.should_continue_automation).toBe(true);
    expect(result.body.next_profile_step).toBe('ask_birthdate');
    expect(result.body.writeback_applied).toBe(true);
    expect(result.body.writeback_fields).toContain('zone');
    expect(result.body.uchat_payload.coverage_status).toBe('covered');
    expect(result.body.uchat_payload.writeback_applied).toBe(true);
    expect(result.body.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_BIRTHDATE_ENRICHMENT_SOFT
    );
  });

  test('does not overwrite existing non-empty values during writeback', async () => {
    detectIntent.mockResolvedValueOnce({
      service_interest: 'soft gel',
      date_preference: null,
      time_preference: null,
      location_hint: 'Valencia',
      has_previous_removal: null,
      design_interest: null,
      intent_type: 'booking'
    });
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        service_interest: 'acrylic',
        zone: 'Salamanca',
        email: '',
        notes: '',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.enriched_profile_context.service_interest).toBe('acrylic');
    expect(result.body.enriched_profile_context.zone).toBe('Salamanca');
    expect(result.body.writeback_applied).toBe(false);
    expect(updateClientFields).not.toHaveBeenCalled();
  });

  test('returns EXISTING and profile completion for partial profile', async () => {
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        email: '',
        last_visit: '2026-03-01',
        notes: '',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.EXISTING);
    expect(result.body.profile_status).toBe(PROFILE_STATUS.PARTIAL);
    expect(result.body.next_route).toBe(NEXT_ROUTE.PROFILE_COMPLETION);
    expect(result.body.persistence_ok).toBe(true);
    expect(result.body.persistence_action).toBe('update');
    expect(result.body.sales_route).toBe(SALES_ROUTE.ROUTE_EXISTING_PROFILE_COMPLETION);
    expect(result.body.conversation_goal).toBe('complete_profile');
    expect(result.body.recommended_action).toBe('complete_profile_then_offer');
    expect(result.body.message_key).toBe('existing_profile_completion_v1');
    expect(result.body.next_profile_step).toBe('ask_service');
    expect(updateClient).toHaveBeenCalledTimes(1);
    expect(createClient).not.toHaveBeenCalled();
  });

  test('returns direct sale route for complete existing client', async () => {
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        birthdate: '1992-08-10',
        email: 'maria@example.com',
        last_visit: '2026-03-01',
        notes: 'VIP',
        service_interest: 'gel nails',
        zone: 'Valencia',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.EXISTING);
    expect(result.body.profile_status).toBe(PROFILE_STATUS.COMPLETE);
    expect(result.body.loyalty_signals).toEqual({
      is_vip_client: false,
      birthday_known: true,
      birthday_upcoming: false,
      favorite_service_known: true,
      reactivation_candidate: false
    });
    expect(result.body.sales_route).toBe(SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE);
    expect(result.body.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_EXISTING_CLIENT_FAST_TRACK
    );
    expect(result.body.conversation_goal).toBe('drive_booking');
    expect(result.body.recommended_action).toBe('direct_service_offer');
    expect(result.body.message_key).toBe('existing_direct_offer_v1');
    expect(result.body.next_profile_step).toBe('ready_to_book');
    expect(result.body.writeback_applied).toBe(false);
  });

  test('stops automation for out of coverage location', async () => {
    detectIntent.mockResolvedValueOnce({
      service_interest: 'soft gel',
      date_preference: null,
      time_preference: null,
      location_hint: 'Madrid',
      has_previous_removal: null,
      design_interest: null,
      intent_type: 'booking'
    });
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        email: '',
        notes: '',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.coverage_status).toBe('out_of_area');
    expect(result.body.should_continue_automation).toBe(false);
    expect(result.body.requires_manual_review).toBe(true);
    expect(result.body.uchat_payload.requires_manual_review).toBe(true);
    expect(result.body.uchat_payload.should_continue_automation).toBe(false);
    expect(result.body.sales_route).toBe(SALES_ROUTE.ROUTE_OUT_OF_COVERAGE);
    expect(result.body.closing_strategy).toBe(
      CLOSING_STRATEGY.CLOSE_MANUAL_REVIEW_SAFE
    );
    expect(result.body.next_profile_step).toBe('manual_review');
    expect(result.body.writeback_applied).toBe(false);
    expect(updateClientFields).not.toHaveBeenCalled();
    expect(generateSalesMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        salesRoute: SALES_ROUTE.ROUTE_OUT_OF_COVERAGE,
        nextProfileStep: 'manual_review',
        loyaltySignals: {
          isVipClient: false,
          birthdayKnown: false,
          birthdayUpcoming: false,
          favoriteServiceKnown: false,
          reactivationCandidate: false
        },
        closingStrategy: CLOSING_STRATEGY.CLOSE_MANUAL_REVIEW_SAFE
      })
    );
  });

  test('returns loyalty signals for VIP and reactivation candidate', async () => {
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        birthdate: '1992-04-25',
        vip_status: 'VIP',
        service_interest: 'Soft Gel',
        last_visit: '2026-01-10T10:00:00Z',
        zone: 'Valencia',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.loyalty_signals).toEqual({
      is_vip_client: true,
      birthday_known: true,
      birthday_upcoming: true,
      favorite_service_known: true,
      reactivation_candidate: true
    });
    expect(result.body.closing_strategy).toBe(CLOSING_STRATEGY.CLOSE_REACTIVATION_SOFT);
    expect(generateSalesMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        loyaltySignals: {
          isVipClient: true,
          birthdayKnown: true,
          birthdayUpcoming: true,
          favoriteServiceKnown: true,
          reactivationCandidate: true
        },
        closingStrategy: CLOSING_STRATEGY.CLOSE_REACTIVATION_SOFT
      })
    );
  });

  test('does not write back for DUPLICATE', async () => {
    findClientsByPhone.mockResolvedValue([
      { phone_normalized: '+34612345678', display_name: 'Maria' },
      { phone_normalized: '+34612345678', display_name: 'Maria 2' }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.DUPLICATE);
    expect(result.body.writeback_applied).toBe(false);
    expect(updateClientFields).not.toHaveBeenCalled();
  });

  test('does not write back for lookup ERROR', async () => {
    const error = new Error('Sheet tab not found for "CLIENTES". Verify the exact tab name in .env.');
    error.code = 'GOOGLE_SHEETS_TAB_NOT_FOUND';
    error.details = 'Unable to parse range: CLIENTES!A:ZZ';
    findClientsByPhone.mockRejectedValue(error);

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.ERROR);
    expect(result.body.writeback_applied).toBe(false);
    expect(updateClientFields).not.toHaveBeenCalled();
  });

  test('returns configuration guidance when private key format is invalid', async () => {
    validateEnvironment.mockReturnValue({
      ok: false,
      missing: [],
      invalid: ['GOOGLE_PRIVATE_KEY'],
      message:
        'GOOGLE_PRIVATE_KEY does not look valid. Paste the full private key from the service account JSON and preserve line breaks using \\n inside the .env value.'
    });

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.ERROR);
    expect(result.body.error_code).toBe(ERROR_CODE.CONFIGURATION_ERROR);
    expect(result.body.writeback_applied).toBe(false);
  });

  test('returns invalid phone sales fallback when phone is invalid', async () => {
    const invalidPayload = {
      ...payload,
      phone_raw: '12345'
    };

    const result = await identifyClient(invalidPayload);

    expect(result.body.is_phone_valid).toBe(false);
    expect(result.body.intent_data).toBeUndefined();
    expect(detectIntent).not.toHaveBeenCalled();
    expect(result.body.writeback_applied).toBe(false);
  });

  test('does not run intent detection when environment is invalid', async () => {
    validateEnvironment.mockReturnValue({
      ok: false,
      missing: ['GOOGLE_PRIVATE_KEY'],
      invalid: [],
      message: 'Missing GOOGLE_PRIVATE_KEY'
    });

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.ERROR);
    expect(result.body.intent_data).toBeUndefined();
    expect(detectIntent).not.toHaveBeenCalled();
  });

  test('uses resolved zone object when available for coverage decisions', async () => {
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        email: '',
        last_visit: '2026-03-01',
        notes: '',
        zone: 'la eliana',
        __rowNumber: 2
      }
    ]);

    const result = await identifyClient(payload);

    expect(result.body.coverage_status).toBe('covered');
    expect(result.body.should_continue_automation).toBe(true);
    expect(result.body.requires_manual_review).toBe(false);
  });

  test('returns persistence error metadata when createClient fails', async () => {
    findClientsByPhone.mockResolvedValue([]);
    createClient.mockRejectedValue(new Error('append failed'));

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.NEW);
    expect(result.body.persistence_ok).toBe(false);
    expect(result.body.writeback_applied).toBe(false);
  });

  test('returns persistence error metadata when updateClient fails', async () => {
    findClientsByPhone.mockResolvedValue([
      {
        phone_normalized: '+34612345678',
        display_name: 'Maria',
        email: '',
        notes: '',
        __rowNumber: 2
      }
    ]);
    updateClient.mockRejectedValue(new Error('update failed'));

    const result = await identifyClient(payload);

    expect(result.body.client_status).toBe(CLIENT_STATUS.EXISTING);
    expect(result.body.persistence_ok).toBe(false);
    expect(result.body.writeback_applied).toBe(false);
  });
});
