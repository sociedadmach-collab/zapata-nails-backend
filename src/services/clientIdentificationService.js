const crypto = require('crypto');
const { validateEnvironment } = require('../config/env');
const {
  createClient,
  findClientsByPhone,
  updateClient,
  updateClientFields
} = require('./googleSheetsService');
const { logAutomationEvent } = require('./loggingService');
const { CLIENT_STATUS, PROFILE_STATUS } = require('../constants/clientStatus');
const { NEXT_ROUTE } = require('../constants/routes');
const { ERROR_CODE } = require('../constants/errorCodes');
const {
  normalizeSpanishPhone,
  isValidSpanishMobilePhone
} = require('../utils/phone');
const { evaluateProfileStatus } = require('../utils/profile');
const { determineNextRoute } = require('../utils/routing');
const { determineSalesRouting } = require('../utils/salesRouting');
const { determineNextProfileStep } = require('../utils/profileFlowEngine');
const { mergeIntentIntoProfileContext } = require('../utils/profileContextMerger');
const { resolveServiceFromIntent } = require('../utils/serviceResolver');
const { planWriteback } = require('../utils/writebackPlanner');
const { determineCoverageDecision } = require('../utils/coverageDecision');
const { resolveZone } = require('../utils/zoneResolver');
const { deriveLoyaltySignals } = require('../utils/loyaltySignals');
const { determineClosingStrategy } = require('../utils/closingEngine');
const { formatUchatResponse } = require('../utils/uchatResponseFormatter');
const { detectIntent } = require('./intentDetectionService');
const { generateSalesMessage } = require('./messageGenerationService');
const { SALES_ROUTE } = require('../constants/salesRoutes');

function buildStaticErrorBody({
  requestId,
  clientStatus,
  profileStatus,
  nextRoute,
  phoneRaw,
  phoneNormalized,
  isPhoneValid,
  persistenceOk,
  persistenceAction,
  salesRouting,
  intentData,
  errorCode = null,
  errorMessage = null
}) {
  return {
    ok: true,
    request_id: requestId,
    client_status: clientStatus,
    profile_status: profileStatus,
    next_route: nextRoute,
    phone_raw: phoneRaw,
    phone_normalized: phoneNormalized,
    is_phone_valid: isPhoneValid,
    error_code: errorCode,
    error_message: errorMessage,
    persistence_ok: persistenceOk,
    persistence_action: persistenceAction,
    sales_route: salesRouting.salesRoute,
    conversation_goal: salesRouting.conversationGoal,
    recommended_action: salesRouting.recommendedAction,
    message_key: salesRouting.messageKey,
    next_profile_step: 'ready_to_book',
    missing_required_fields: [],
    missing_optional_fields: [],
    intent_data: intentData,
    enriched_profile_context: {},
    loyalty_signals: {
      is_vip_client: false,
      birthday_known: false,
      birthday_upcoming: false,
      favorite_service_known: false,
      reactivation_candidate: false
    },
    closing_strategy: null,
    closing_script_profile: null,
    coverage_status: 'unknown',
    should_continue_automation: true,
    requires_manual_review: false,
    writeback_applied: false,
    writeback_fields: []
  };
}

async function identifyClient(payload) {
  const requestId = crypto.randomUUID();
  const processedAt = new Date().toISOString();
  const phoneNormalized = normalizeSpanishPhone(payload.phone_raw);
  const isPhoneValid = isValidSpanishMobilePhone(phoneNormalized);
  let intentData;

  if (!isPhoneValid) {
    const salesRouting = determineSalesRouting({
      clientStatus: CLIENT_STATUS.ERROR,
      profileStatus: PROFILE_STATUS.INCOMPLETE,
      nextRoute: NEXT_ROUTE.MANUAL_REVIEW_FALLBACK,
      persistenceOk: false,
      isPhoneValid: false
    });

    const body = buildStaticErrorBody({
      requestId,
      clientStatus: CLIENT_STATUS.ERROR,
      profileStatus: PROFILE_STATUS.INCOMPLETE,
      nextRoute: NEXT_ROUTE.MANUAL_REVIEW_FALLBACK,
      phoneRaw: payload.phone_raw,
      phoneNormalized,
      isPhoneValid: false,
      persistenceOk: false,
      persistenceAction: 'skip_error',
      salesRouting,
      intentData
    });

    const messageResult = await generateSalesMessage({
      salesRoute: body.sales_route,
      nextProfileStep: body.next_profile_step,
      intentData,
      enrichedProfileContext: body.enriched_profile_context,
      clientStatus: body.client_status,
      profileStatus: body.profile_status,
      displayName: payload.display_name,
      closingStrategy: null,
      closingScriptProfile: null,
      loyaltySignals: {
        isVipClient: false,
        birthdayKnown: false,
        birthdayUpcoming: false,
        favoriteServiceKnown: false,
        reactivationCandidate: false
      }
    });

    body.generated_message = messageResult.generatedMessage;
    body.message_strategy = messageResult.messageStrategy;
    body.tone_profile = messageResult.toneProfile;
    body.resolved_service_key = messageResult.resolvedServiceKey;
    body.resolved_service_data = messageResult.resolvedServiceData;
    body.display_price = messageResult.displayPrice?.value || null;
    // Compact payload intended for UChat custom field mapping and condition routing.
    body.uchat_payload = formatUchatResponse(body);

    await logAutomationEvent({
      request_id: requestId,
      timestamp: processedAt,
      module: 'client_identification',
      status: body.client_status,
      phone_raw: payload.phone_raw,
      phone_normalized: phoneNormalized,
      next_route: body.next_route,
      error_code: null,
      error_message: null,
      persistence_ok: body.persistence_ok,
      persistence_action: body.persistence_action,
      matched_records: 0,
      source: payload.source
    });

    return {
      httpStatus: 200,
      body
    };
  }

  const envValidation = validateEnvironment();

  if (!envValidation.ok) {
    const salesRouting = determineSalesRouting({
      clientStatus: CLIENT_STATUS.ERROR,
      profileStatus: PROFILE_STATUS.INCOMPLETE,
      nextRoute: NEXT_ROUTE.TECHNICAL_FALLBACK,
      persistenceOk: false,
      isPhoneValid: true
    });

    const body = buildStaticErrorBody({
      requestId,
      clientStatus: CLIENT_STATUS.ERROR,
      profileStatus: PROFILE_STATUS.INCOMPLETE,
      nextRoute: NEXT_ROUTE.TECHNICAL_FALLBACK,
      phoneRaw: payload.phone_raw,
      phoneNormalized,
      isPhoneValid: true,
      persistenceOk: false,
      persistenceAction: 'skip_error',
      salesRouting,
      intentData,
      errorCode: ERROR_CODE.CONFIGURATION_ERROR,
      errorMessage: envValidation.message
    });

    const messageResult = await generateSalesMessage({
      salesRoute: body.sales_route,
      nextProfileStep: body.next_profile_step,
      intentData,
      enrichedProfileContext: body.enriched_profile_context,
      clientStatus: body.client_status,
      profileStatus: body.profile_status,
      displayName: payload.display_name,
      closingStrategy: null,
      closingScriptProfile: null,
      loyaltySignals: {
        isVipClient: false,
        birthdayKnown: false,
        birthdayUpcoming: false,
        favoriteServiceKnown: false,
        reactivationCandidate: false
      }
    });

    body.generated_message = messageResult.generatedMessage;
    body.message_strategy = messageResult.messageStrategy;
    body.tone_profile = messageResult.toneProfile;
    body.resolved_service_key = messageResult.resolvedServiceKey;
    body.resolved_service_data = messageResult.resolvedServiceData;
    body.display_price = messageResult.displayPrice?.value || null;
    // Compact payload intended for UChat custom field mapping and condition routing.
    body.uchat_payload = formatUchatResponse(body);

    await logAutomationEvent({
      request_id: requestId,
      timestamp: processedAt,
      module: 'client_identification',
      status: body.client_status,
      phone_raw: payload.phone_raw,
      phone_normalized: phoneNormalized,
      next_route: body.next_route,
      error_code: body.error_code,
      error_message: body.error_message,
      persistence_ok: body.persistence_ok,
      persistence_action: body.persistence_action,
      matched_records: 0,
      source: payload.source
    });

    return {
      httpStatus: 200,
      body
    };
  }

  intentData = payload.message_text
    ? await detectIntent({ messageText: payload.message_text })
    : undefined;

  let matchedClients = [];
  let clientStatus = CLIENT_STATUS.NEW;
  let profileStatus = PROFILE_STATUS.INCOMPLETE;
  let lookupError = null;
  let persistenceAction = 'skip_error';
  let persistenceOk = false;
  let persistenceErrorCode = null;
  let persistenceErrorMessage = null;
  let persistedClientRecord = null;

  try {
    matchedClients = await findClientsByPhone(phoneNormalized);

    if (matchedClients.length > 1) {
      clientStatus = CLIENT_STATUS.DUPLICATE;
      profileStatus = PROFILE_STATUS.PARTIAL;
    } else if (matchedClients.length === 1) {
      clientStatus = CLIENT_STATUS.EXISTING;
      profileStatus = evaluateProfileStatus(matchedClients[0]);
    }
  } catch (error) {
    lookupError = error;
    clientStatus = CLIENT_STATUS.ERROR;
    profileStatus = PROFILE_STATUS.INCOMPLETE;
  }

  const nextRoute = determineNextRoute({
    clientStatus,
    profileStatus,
    hasTechnicalError: Boolean(lookupError)
  });

  const body = {
    ok: true,
    request_id: requestId,
    source: payload.source,
    received_at: processedAt,
    phone_raw: payload.phone_raw,
    phone_normalized: phoneNormalized,
    is_phone_valid: true,
    client_status: clientStatus,
    profile_status: profileStatus,
    next_route: nextRoute,
    matched_records: matchedClients.length,
    duplicate_count: clientStatus === CLIENT_STATUS.DUPLICATE ? matchedClients.length : undefined,
    client_record: clientStatus === CLIENT_STATUS.DUPLICATE ? null : matchedClients[0] || null,
    error_code: lookupError ? ERROR_CODE.GOOGLE_SHEETS_LOOKUP_FAILED : null,
    error_message: lookupError
      ? `${lookupError.message}${lookupError.details ? ` Details: ${lookupError.details}` : ''}`
      : null,
    persistence_ok: false,
    persistence_action: 'skip_error',
    intent_data: intentData,
    writeback_applied: false,
    writeback_fields: []
  };

  if (lookupError) {
    persistenceOk = false;
    persistenceAction = 'skip_error';
  } else {
    try {
      if (clientStatus === CLIENT_STATUS.NEW) {
        persistenceAction = 'create';
        persistedClientRecord = await createClient({
          phoneNormalized,
          displayName: payload.display_name,
          lastVisit: processedAt
        });
        persistenceOk = true;
      }

      if (clientStatus === CLIENT_STATUS.EXISTING && matchedClients[0]) {
        persistenceAction = 'update';
        persistedClientRecord = await updateClient(matchedClients[0], {
          displayName: payload.display_name,
          lastVisit: processedAt
        });
        persistenceOk = true;
      }

      if (clientStatus === CLIENT_STATUS.DUPLICATE) {
        persistenceAction = 'skip_duplicate';
        persistenceOk = true;
      }
    } catch (error) {
      persistenceOk = false;
      persistenceErrorCode = error.code || ERROR_CODE.CLIENT_PERSISTENCE_FAILED;
      persistenceErrorMessage = 'Client persistence failed';
      console.error('Failed to persist client data:', error.message);
    }
  }

  body.persistence_ok = persistenceOk;
  body.persistence_action = persistenceAction;

  const salesRouting = determineSalesRouting({
    clientStatus,
    profileStatus,
    nextRoute,
    persistenceOk,
    isPhoneValid: true
  });

  body.sales_route = salesRouting.salesRoute;
  body.conversation_goal = salesRouting.conversationGoal;
  body.recommended_action = salesRouting.recommendedAction;
  body.message_key = salesRouting.messageKey;

  const enrichedProfileContext = mergeIntentIntoProfileContext({
    clientRecord: body.client_record,
    intentData
  });

  body.enriched_profile_context = enrichedProfileContext;

  const loyaltySignals = deriveLoyaltySignals({
    clientRecord: body.client_record,
    processedAt
  });

  body.loyalty_signals = {
    is_vip_client: loyaltySignals.isVipClient,
    birthday_known: loyaltySignals.birthdayKnown,
    birthday_upcoming: loyaltySignals.birthdayUpcoming,
    favorite_service_known: loyaltySignals.favoriteServiceKnown,
    reactivation_candidate: loyaltySignals.reactivationCandidate
  };

  const coverageDecision = determineCoverageDecision({
    resolvedZone: resolveZone({
      locationHint: intentData?.location_hint,
      zoneValue: enrichedProfileContext.zone
    }),
    locationHint: enrichedProfileContext.zone || intentData?.location_hint || null
  });

  body.coverage_status = coverageDecision.coverageStatus;
  body.should_continue_automation = coverageDecision.shouldContinueAutomation;
  body.requires_manual_review = coverageDecision.requiresManualReview;

  const profileFlow = determineNextProfileStep({
    clientRecord: enrichedProfileContext,
    clientStatus,
    profileStatus,
    salesRoute: body.sales_route
  });

  body.next_profile_step = profileFlow.next_profile_step;
  body.missing_required_fields = profileFlow.missing_required_fields;
  body.missing_optional_fields = profileFlow.missing_optional_fields;

  if (
    body.coverage_status === 'unknown' &&
    (enrichedProfileContext.zone || intentData?.location_hint)
  ) {
    body.next_profile_step = 'ask_zone';
    if (!body.missing_optional_fields.includes('zone')) {
      body.missing_optional_fields = [...body.missing_optional_fields, 'zone'];
    }
  }

  if (body.coverage_status === 'out_of_area') {
    body.sales_route = SALES_ROUTE.ROUTE_OUT_OF_COVERAGE;
    body.conversation_goal = 'confirm_service_area';
    body.recommended_action = 'manual_zone_confirmation';
    body.message_key = 'out_of_coverage_fallback_v1';
    body.next_profile_step = 'manual_review';
    body.missing_required_fields = [];
    body.missing_optional_fields = [];
  }

  const resolvedService = resolveServiceFromIntent({
    intentData,
    enrichedProfileContext
  });

  const closingDecision = determineClosingStrategy({
    clientStatus,
    salesRoute: body.sales_route,
    nextProfileStep: body.next_profile_step,
    resolvedServiceKey: resolvedService.serviceKey,
    coverageStatus: body.coverage_status,
    loyaltySignals,
    intentData,
    enrichedProfileContext: body.enriched_profile_context
  });

  body.closing_strategy = closingDecision.closing_strategy;
  body.closing_script_profile = closingDecision.closing_script_profile
    ? {
        goal: closingDecision.closing_script_profile.goal,
        message_intent: closingDecision.closing_script_profile.message_intent,
        persuasion_angle: closingDecision.closing_script_profile.persuasion_angle,
        next_step_focus: closingDecision.closing_script_profile.next_step_focus
      }
    : null;

  const writebackEligible =
    [CLIENT_STATUS.NEW, CLIENT_STATUS.EXISTING].includes(clientStatus) &&
    persistenceOk === true &&
    body.coverage_status !== 'out_of_area';

  if (writebackEligible) {
    const referenceRecord =
      clientStatus === CLIENT_STATUS.NEW ? persistedClientRecord : matchedClients[0];

    const writebackPlan = planWriteback({
      clientRecord: referenceRecord,
      intentData,
      resolvedServiceKey: resolvedService.serviceKey,
      resolvedServiceData: resolvedService.serviceData,
      enrichedProfileContext
    });

    if (body.coverage_status !== 'covered' && writebackPlan.fieldsToWrite.zone) {
      delete writebackPlan.fieldsToWrite.zone;
      writebackPlan.shouldWrite = Object.keys(writebackPlan.fieldsToWrite).length > 0;
    }

    if (writebackPlan.shouldWrite && referenceRecord?.__rowNumber) {
      try {
        const updatedAfterWriteback = await updateClientFields(
          referenceRecord,
          writebackPlan.fieldsToWrite
        );
        body.writeback_applied = true;
        body.writeback_fields = Object.keys(writebackPlan.fieldsToWrite);
        body.enriched_profile_context = {
          ...body.enriched_profile_context,
          ...writebackPlan.fieldsToWrite
        };
        if (body.client_record) {
          body.client_record = updatedAfterWriteback;
        }
      } catch (error) {
        console.error('Write-back failed:', error.message);
      }
    }
  }

  const messageResult = await generateSalesMessage({
    salesRoute: body.sales_route,
    nextProfileStep: body.next_profile_step,
    intentData,
    enrichedProfileContext: body.enriched_profile_context,
    clientStatus,
    profileStatus,
    displayName: payload.display_name || body.enriched_profile_context.display_name,
    closingStrategy: body.closing_strategy,
    closingScriptProfile: body.closing_script_profile,
    loyaltySignals
  });

  body.generated_message = messageResult.generatedMessage;
  body.message_strategy = messageResult.messageStrategy;
  body.tone_profile = messageResult.toneProfile;
  body.resolved_service_key = messageResult.resolvedServiceKey || resolvedService.serviceKey;
  body.resolved_service_data =
    messageResult.resolvedServiceData ||
    (resolvedService.serviceData
      ? {
          display_name: resolvedService.serviceData.display_name,
          category: resolvedService.serviceData.category,
          summary: resolvedService.serviceData.summary,
          benefits: resolvedService.serviceData.benefits.slice(0, 4),
          guarantee: resolvedService.serviceData.guarantee?.text || null,
          notes: resolvedService.serviceData.notes || []
        }
      : null);
  body.display_price = messageResult.displayPrice?.value || null;
  // Compact payload intended for UChat custom field mapping and condition routing.
  body.uchat_payload = formatUchatResponse(body);

  if (!body.error_code && persistenceErrorCode) {
    body.error_code = persistenceErrorCode;
  }

  if (!body.error_message && persistenceErrorMessage) {
    body.error_message = persistenceErrorMessage;
  }

  await logAutomationEvent({
    request_id: requestId,
    timestamp: processedAt,
    module: 'client_identification',
    status: clientStatus,
    phone_raw: payload.phone_raw,
    phone_normalized: phoneNormalized,
    next_route: nextRoute,
    error_code: body.error_code || persistenceErrorCode,
    error_message: body.error_message,
    persistence_ok: body.persistence_ok,
    persistence_action: body.persistence_action,
    matched_records: matchedClients.length,
    source: payload.source
  });

  return {
    httpStatus: 200,
    body
  };
}

module.exports = {
  identifyClient
};
