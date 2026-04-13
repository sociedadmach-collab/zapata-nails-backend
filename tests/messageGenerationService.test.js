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

describe('messageGenerationService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MESSAGE_MODEL = 'gpt-4o-mini';
  });

  test('returns ai generated message when OpenAI succeeds', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content:
              'Hola hermosa, Soft Gel te va a encantar porque tiene acabado natural y elegante, mas ligero y comodo. Su precio es 35.99€. Si quieres, te dejo listo el siguiente paso.'
          }
        }
      ]
    });

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_NEW_ONBOARDING',
      nextProfileStep: 'ask_zone',
      intentData: { service_interest: 'soft gel' },
      enrichedProfileContext: { service_interest: 'soft gel' },
      clientStatus: 'NEW',
      profileStatus: 'INCOMPLETE',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('ai_generated');
    expect(result.generatedMessage).toContain('35.99€');
    expect(result.resolvedServiceKey).toBe('soft_gel');
    expect(result.displayPrice.value).toBe('35.99€');
  });

  test('falls back to deterministic template when OpenAI fails', async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error('OpenAI unavailable'));

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_NEW_ONBOARDING',
      nextProfileStep: 'ask_service',
      intentData: {},
      enrichedProfileContext: {},
      clientStatus: 'NEW',
      profileStatus: 'INCOMPLETE',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('fallback_template');
    expect(result.generatedMessage).toContain('servicio');
  });

  test('falls back when OpenAI mentions a wrong decimal price', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content:
              'Hola hermosa, Soft Gel te va a encantar y su precio es 39.99€. Si quieres, te lo dejo listo.'
          }
        }
      ]
    });

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_NEW_ONBOARDING',
      nextProfileStep: 'ask_zone',
      intentData: { service_interest: 'soft gel' },
      enrichedProfileContext: { service_interest: 'soft gel' },
      clientStatus: 'NEW',
      profileStatus: 'INCOMPLETE',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('fallback_template');
    expect(result.generatedMessage).toContain('35.99€');
  });

  test('falls back when OpenAI mentions price in euros text format and it is wrong', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content:
              'Hola hermosa, Soft Gel te va a encantar y su precio es 35 euros. Si quieres, te lo dejo listo.'
          }
        }
      ]
    });

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_NEW_ONBOARDING',
      nextProfileStep: 'ask_zone',
      intentData: { service_interest: 'soft gel' },
      enrichedProfileContext: { service_interest: 'soft gel' },
      clientStatus: 'NEW',
      profileStatus: 'INCOMPLETE',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('fallback_template');
  });

  test('falls back when no official service exists and AI mentions 35€', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Hola hermosa, te va a encantar y el precio es 35€.'
          }
        }
      ]
    });

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_NEW_ONBOARDING',
      nextProfileStep: 'ask_service',
      intentData: { service_interest: 'algo bonito' },
      enrichedProfileContext: {},
      clientStatus: 'NEW',
      profileStatus: 'INCOMPLETE',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('fallback_template');
    expect(result.resolvedServiceKey).toBeNull();
    expect(result.generatedMessage).not.toContain('€');
  });

  test('uses duplicate fallback template for duplicate route', async () => {
    process.env.OPENAI_API_KEY = '';

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_DUPLICATE_SAFE_FALLBACK',
      nextProfileStep: 'ready_to_book',
      intentData: {},
      enrichedProfileContext: {},
      clientStatus: 'DUPLICATE',
      profileStatus: 'PARTIAL',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('fallback_template');
    expect(result.generatedMessage).toContain('no confundirme');
  });

  test('uses out of coverage fallback template without calling OpenAI', async () => {
    const mockCreate = jest.fn();

    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));

    const { generateSalesMessage } = require('../src/services/messageGenerationService');
    const result = await generateSalesMessage({
      salesRoute: 'ROUTE_OUT_OF_COVERAGE',
      nextProfileStep: 'manual_review',
      intentData: { location_hint: 'Madrid' },
      enrichedProfileContext: { zone: 'Madrid' },
      clientStatus: 'EXISTING',
      profileStatus: 'PARTIAL',
      displayName: 'Mady'
    });

    expect(result.messageStrategy).toBe('fallback_template');
    expect(result.generatedMessage).toContain('revisar tu zona personalmente');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
