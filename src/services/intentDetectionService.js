const OpenAI = require('openai');
const { env } = require('../config/env');
const { INTENT_FIELDS } = require('../constants/intentSchema');

let openaiClient = null;

function getEmptyIntent() {
  return {
    ...INTENT_FIELDS
  };
}

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

function sanitizeIntentPayload(payload) {
  const base = getEmptyIntent();

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return base;
  }

  const normalizedIntentType = ['booking', 'info', 'price', 'other'].includes(payload.intent_type)
    ? payload.intent_type
    : base.intent_type;

  return {
    service_interest: payload.service_interest ?? null,
    date_preference: payload.date_preference ?? null,
    time_preference: payload.time_preference ?? null,
    location_hint: payload.location_hint ?? null,
    has_previous_removal:
      typeof payload.has_previous_removal === 'boolean' ? payload.has_previous_removal : null,
    design_interest: payload.design_interest ?? null,
    intent_type: normalizedIntentType
  };
}

function extractContentFromCompletion(response) {
  const content = response?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (item && typeof item.text === 'string' ? item.text : ''))
      .join('')
      .trim();
  }

  return '';
}

async function detectIntent({ messageText }) {
  if (!messageText || !String(messageText).trim()) {
    return getEmptyIntent();
  }

  const client = getOpenAIClient();

  if (!client) {
    return getEmptyIntent();
  }

  try {
    const response = await client.chat.completions.create({
      model: env.openaiIntentModel,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that extracts structured booking data for a nail salon. Return ONLY valid JSON with these fields: service_interest, date_preference, time_preference, location_hint, has_previous_removal, design_interest, intent_type. Rules: Do not invent data. Use null if unknown. intent_type must be one of: booking, info, price, other.'
        },
        {
          role: 'user',
          content: `Message:\n${String(messageText).trim()}`
        }
      ]
    });

    const rawContent = extractContentFromCompletion(response);

    if (!rawContent) {
      return getEmptyIntent();
    }

    return sanitizeIntentPayload(JSON.parse(rawContent));
  } catch (error) {
    console.error('Intent detection failed:', error.message);
    return getEmptyIntent();
  }
}

module.exports = {
  detectIntent,
  getEmptyIntent,
  sanitizeIntentPayload
};
