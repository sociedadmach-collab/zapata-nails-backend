const { resolveServiceFromIntent } = require('../src/utils/serviceResolver');

describe('serviceResolver', () => {
  test('resolves soft gel correctly', () => {
    const result = resolveServiceFromIntent({
      intentData: { service_interest: 'soft gel' },
      enrichedProfileContext: {}
    });

    expect(result.serviceKey).toBe('soft_gel');
    expect(result.serviceData.display_name).toBe('Soft Gel');
  });

  test('resolves experiencia zapata correctly', () => {
    const result = resolveServiceFromIntent({
      intentData: { service_interest: 'Quiero experiencia zapata' },
      enrichedProfileContext: {}
    });

    expect(result.serviceKey).toBe('experiencia_zapata');
    expect(result.serviceData.display_name).toBe('Experiencia ZAPATA');
  });

  test('resolves premium to zapata elite', () => {
    const result = resolveServiceFromIntent({
      intentData: { service_interest: 'quiero algo premium' },
      enrichedProfileContext: {}
    });

    expect(result.serviceKey).toBe('zapata_elite');
  });

  test('resolves spa en casa to experiencia zapata', () => {
    const result = resolveServiceFromIntent({
      intentData: { service_interest: 'quiero spa en casa' },
      enrichedProfileContext: {}
    });

    expect(result.serviceKey).toBe('experiencia_zapata');
  });

  test('resolves gel natural to soft gel', () => {
    const result = resolveServiceFromIntent({
      intentData: { service_interest: 'quiero gel natural' },
      enrichedProfileContext: {}
    });

    expect(result.serviceKey).toBe('soft_gel');
  });

  test('does not resolve ambiguous unrelated text', () => {
    const result = resolveServiceFromIntent({
      intentData: { service_interest: 'quiero algo bonito' },
      enrichedProfileContext: {}
    });

    expect(result.serviceKey).toBeNull();
    expect(result.serviceData).toBeNull();
  });
});
