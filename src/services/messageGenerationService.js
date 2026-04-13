const OpenAI = require('openai');
const { env } = require('../config/env');
const { SALES_ROUTE } = require('../constants/salesRoutes');
const { resolveServiceFromIntent } = require('../utils/serviceResolver');
const {
  MESSAGE_GENERATION_PROFILE,
  TONE_PROFILE
} = require('../constants/messageGenerationProfiles');

let openaiClient = null;

function getOpenAIClient() {
  if (!env.openaiApiKey) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.openaiApiKey
    });
  }

  return openaiClient;
}

function getShortName(displayName) {
  if (!displayName || !String(displayName).trim()) {
    return 'hermosa';
  }

  return String(displayName).trim().split(/\s+/)[0];
}

function buildFallbackMessage({
  salesRoute,
  nextProfileStep,
  displayName,
  enrichedProfileContext,
  serviceData,
  displayPrice
}) {
  const name = getShortName(displayName || enrichedProfileContext?.display_name);
  const priceSnippet = displayPrice?.value
    ? ` Su ${displayPrice.label} es ${displayPrice.value}.`
    : '';
  const serviceSnippet = serviceData
    ? `${serviceData.display_name} es ${serviceData.summary.toLowerCase()}.`
    : '';
  const benefitSnippet = serviceData?.benefits?.length
    ? ` Incluye ${serviceData.benefits.slice(0, 2).join(' y ')}.`
    : '';
  const templates = {
    ask_service: `Hola ${name}, hermosa. Quiero dejarte tu momento spa en casa super bonito. Contame que servicio te gustaria hacerte y te lo dejo listo.`,
    ask_zone: `Perfecto ${name}, hermosa. ${serviceSnippet}${benefitSnippet}${priceSnippet} Para orientarte mejor y prepararte una experiencia linda, decime en que zona estas y te lo dejo listo.`,
    ask_name: 'Hola hermosa. Quiero atenderte super bonito. Me compartes tu nombre para seguir contigo y dejarte todo listo?',
    ask_birthdate: 'Hermosa, antes de seguir quiero guardar un datito lindo para mimarte mejor. Si quieres, comparteme tu fecha de cumple y te lo dejo listo.',
    ready_to_book: `Hermosa, ya tenemos lo necesario para seguir contigo. ${serviceSnippet}${benefitSnippet}${priceSnippet} Te va a encantar este momento spa en casa. Cuentame que te gustaria agendar y te lo dejo listo.`,
    duplicate_fallback: 'Hermosa, quiero cuidarte bien para no confundirme con tus datos. Te acompano por un camino seguro y te lo dejo listo enseguida.',
    technical_fallback: 'Hermosa, estoy acomodando un detalle para atenderte bonito sin hacerte perder tiempo. Seguimos contigo y te lo dejo listo.',
    out_of_coverage_fallback:
      'Hermosa, dejame revisar tu zona personalmente para confirmarte disponibilidad y darte la mejor experiencia. Te lo dejo listo en cuanto lo valide contigo.'
  };

  if (salesRoute === SALES_ROUTE.ROUTE_DUPLICATE_SAFE_FALLBACK) {
    return templates.duplicate_fallback;
  }

  if (
    salesRoute === SALES_ROUTE.ROUTE_TECHNICAL_FALLBACK ||
    salesRoute === SALES_ROUTE.ROUTE_INVALID_PHONE_FALLBACK
  ) {
    return templates.technical_fallback;
  }

  if (salesRoute === SALES_ROUTE.ROUTE_OUT_OF_COVERAGE) {
    return templates.out_of_coverage_fallback;
  }

  return templates[nextProfileStep] || templates.ready_to_book;
}

function selectDisplayPrice(serviceData) {
  if (!serviceData?.prices) {
    return {
      label: null,
      value: null
    };
  }

  if (serviceData.category === 'combo' && serviceData.prices.discount) {
    return {
      label: 'precio con descuento',
      value: serviceData.prices.discount
    };
  }

  if (serviceData.prices.standard) {
    return {
      label: 'precio',
      value: serviceData.prices.standard
    };
  }

  if (serviceData.prices.initial) {
    return {
      label: 'precio',
      value: serviceData.prices.initial
    };
  }

  return {
    label: null,
    value: null
  };
}

function buildMessageGenerationPrompt({
  salesRoute,
  nextProfileStep,
  intentData,
  enrichedProfileContext,
  clientStatus,
  profileStatus,
  displayName,
  closingStrategy,
  closingScriptProfile,
  loyaltySignals,
  serviceData,
  displayPrice
}) {
  const fallbackMessage = buildFallbackMessage({
    salesRoute,
    nextProfileStep,
    displayName,
    enrichedProfileContext,
    serviceData,
    displayPrice
  });

  return [
    'Write one WhatsApp message in Spanish for ZAPATA NAILS.',
    'Tone: warm, feminine, elegant, emotionally persuasive, natural, premium but close.',
    'Brand ideas: spa at home, emotional care, espacio bonito, te va a encantar, te lo dejo listo, hermosa.',
    `Use these positioning anchors naturally when relevant: ${MESSAGE_GENERATION_PROFILE.businessAnchors.join(', ')}.`,
    'Ask only for the next needed step. Do not ask for multiple things.',
    'Only use service data provided below. Do not invent prices, discounts, guarantees, policies, availability, or conditions.',
    'Do not mention AI or systems.',
    'Return plain text only, one short message, no markdown.',
    `closingStrategy=${closingStrategy || ''}`,
    `closingScriptProfile=${JSON.stringify(closingScriptProfile || {})}`,
    `loyaltySignals=${JSON.stringify(loyaltySignals || {})}`,
    'If isVipClient is true, you may sound slightly more premium. If birthdayKnown is true, you may sound a little warmer and more familiar. If favoriteServiceKnown is true, you may sound smoother and more continuous.',
    'Do not mention birthday, VIP status, rewards, or loyalty benefits unless the current next step clearly justifies it.',
    'Use the closing strategy as guidance. Do not improvise sales logic outside the provided strategy.',
    'If the strategy suggests an upgrade, guide gently from the individual service toward a richer experience without pressure.',
    'You may reference Glow Express or Experiencia ZAPATA naturally only when appropriate, and never invent price, discount, or policy.',
    `Context: salesRoute=${salesRoute}, nextProfileStep=${nextProfileStep}, clientStatus=${clientStatus}, profileStatus=${profileStatus}.`,
    `displayName=${displayName || ''}`,
    `intentData=${JSON.stringify(intentData || {})}`,
    `enrichedProfileContext=${JSON.stringify(enrichedProfileContext || {})}`,
    serviceData
      ? `officialServiceData=${JSON.stringify({
          display_name: serviceData.display_name,
          summary: serviceData.summary,
          benefits: serviceData.benefits.slice(0, 4),
          selected_price: displayPrice?.value || null,
          guarantee: serviceData.guarantee?.text || null,
          notes: serviceData.notes || []
        })}`
      : 'officialServiceData=null. Do not mention prices or guarantees.',
    `If unsure, stay close to this fallback style: ${fallbackMessage}`
  ].join('\n');
}

function normalizePriceValue(value) {
  const numericMatch = String(value || '').match(/\d+(?:[.,]\d{1,2})?/);

  if (!numericMatch) {
    return null;
  }

  const normalizedNumber = Number(numericMatch[0].replace(',', '.'));

  if (Number.isNaN(normalizedNumber)) {
    return null;
  }

  return normalizedNumber.toFixed(2);
}

function validateGeneratedMessage({ generatedMessage, serviceData, displayPrice }) {
  const text = String(generatedMessage || '');

  if (!text.trim()) {
    return false;
  }

  const priceMatches =
    text.match(/\b\d+(?:[.,]\d{1,2})?\s*(?:€|eur|euros)\b|\b\d+(?:[.,]\d{1,2})?\s*€/gi) || [];

  if (!serviceData) {
    return priceMatches.length === 0;
  }

  if (priceMatches.length > 0) {
    if (!displayPrice?.value) {
      return false;
    }

    const allowedNormalized = normalizePriceValue(displayPrice.value);
    const allAllowed = priceMatches.every((price) => {
      return normalizePriceValue(price) === allowedNormalized;
    });

    if (!allAllowed) {
      return false;
    }
  }

  const guaranteeMention = /garanti/i.test(text);
  if (guaranteeMention) {
    const officialGuaranteeText = serviceData.guarantee?.text || '';
    if (!officialGuaranteeText || !text.includes(officialGuaranteeText)) {
      return false;
    }
  }

  return true;
}

async function generateSalesMessage({
  salesRoute,
  nextProfileStep,
  intentData,
  enrichedProfileContext,
  clientStatus,
  profileStatus,
  displayName,
  closingStrategy,
  closingScriptProfile,
  loyaltySignals
}) {
  const { serviceKey, serviceData } = resolveServiceFromIntent({
    intentData,
    enrichedProfileContext
  });
  const displayPrice = selectDisplayPrice(serviceData);

  const fallbackMessage = buildFallbackMessage({
    salesRoute,
    nextProfileStep,
    displayName,
    enrichedProfileContext,
    serviceData,
    displayPrice
  });

  const fallbackResult = {
    generatedMessage: fallbackMessage,
    messageStrategy: 'fallback_template',
    toneProfile: TONE_PROFILE,
    resolvedServiceKey: serviceKey,
    resolvedServiceData: serviceData
      ? {
          display_name: serviceData.display_name,
          category: serviceData.category,
          summary: serviceData.summary,
          benefits: serviceData.benefits.slice(0, 4),
          guarantee: serviceData.guarantee?.text || null,
          notes: serviceData.notes || []
        }
      : null,
    displayPrice
  };

  if (salesRoute === SALES_ROUTE.ROUTE_OUT_OF_COVERAGE) {
    return fallbackResult;
  }

  const client = getOpenAIClient();

  if (!client) {
    return fallbackResult;
  }

  try {
    const response = await client.chat.completions.create({
      model: env.openaiMessageModel || env.openaiIntentModel || 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You write conversion-focused WhatsApp replies for a premium home nail salon brand. Keep it warm, feminine, elegant, emotionally persuasive, and natural. One message only. Plain text only.'
        },
        {
          role: 'user',
          content: buildMessageGenerationPrompt({
            salesRoute,
            nextProfileStep,
            intentData,
            enrichedProfileContext,
            clientStatus,
            profileStatus,
            displayName,
            closingStrategy,
            closingScriptProfile,
            loyaltySignals,
            serviceData,
            displayPrice
          })
        }
      ]
    });

    const content = response?.choices?.[0]?.message?.content;
    const generatedMessage = typeof content === 'string' ? content.trim() : '';

    if (!generatedMessage) {
      return fallbackResult;
    }

    if (!validateGeneratedMessage({ generatedMessage, serviceData, displayPrice })) {
      return fallbackResult;
    }

    return {
      generatedMessage,
      messageStrategy: 'ai_generated',
      toneProfile: TONE_PROFILE,
      resolvedServiceKey: fallbackResult.resolvedServiceKey,
      resolvedServiceData: fallbackResult.resolvedServiceData,
      displayPrice
    };
  } catch (error) {
    console.error('Message generation failed:', error.message);
    return fallbackResult;
  }
}

module.exports = {
  generateSalesMessage,
  buildFallbackMessage,
  selectDisplayPrice,
  validateGeneratedMessage,
  normalizePriceValue
};
