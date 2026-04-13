jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

const OpenAI = require('openai');

describe('intentDetectionService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_INTENT_MODEL = 'gpt-4o-mini';
  });

  test('extracts service and date from a booking message', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              service_interest: 'soft gel',
              date_preference: 'manana',
              time_preference: null,
              location_hint: null,
              has_previous_removal: null,
              design_interest: null,
              intent_type: 'booking'
            })
          }
        }
      ]
    });

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { detectIntent } = require('../src/services/intentDetectionService');
    const result = await detectIntent({
      messageText: 'Hola, quiero soft gel manana por la tarde'
    });

    expect(result.service_interest).toBe('soft gel');
    expect(result.date_preference).toBe('manana');
    expect(result.intent_type).toBe('booking');
  });

  test('returns empty schema for empty message', async () => {
    const { detectIntent } = require('../src/services/intentDetectionService');
    const result = await detectIntent({ messageText: '' });

    expect(result).toEqual({
      service_interest: null,
      date_preference: null,
      time_preference: null,
      location_hint: null,
      has_previous_removal: null,
      design_interest: null,
      intent_type: 'booking'
    });
  });

  test('returns sanitized fallback for ambiguous or invalid model output', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'not-json'
          }
        }
      ]
    });

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { detectIntent } = require('../src/services/intentDetectionService');
    const result = await detectIntent({
      messageText: 'Queria consultar algo'
    });

    expect(result).toEqual({
      service_interest: null,
      date_preference: null,
      time_preference: null,
      location_hint: null,
      has_previous_removal: null,
      design_interest: null,
      intent_type: 'booking'
    });
  });
});
