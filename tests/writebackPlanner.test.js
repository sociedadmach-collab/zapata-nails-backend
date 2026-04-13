const { planWriteback } = require('../src/utils/writebackPlanner');

describe('writebackPlanner', () => {
  test('plans service_interest writeback only when service is officially resolved', () => {
    const result = planWriteback({
      clientRecord: {},
      intentData: { service_interest: 'soft gel' },
      resolvedServiceKey: 'soft_gel',
      resolvedServiceData: { display_name: 'Soft Gel' },
      enrichedProfileContext: { service_interest: 'soft gel' }
    });

    expect(result.shouldWrite).toBe(true);
    expect(result.fieldsToWrite.service_interest).toBe('Soft Gel');
  });

  test('plans zone writeback only for safe non-empty values', () => {
    const result = planWriteback({
      clientRecord: {},
      intentData: { location_hint: 'Madrid centro' },
      resolvedServiceKey: null,
      resolvedServiceData: null,
      enrichedProfileContext: {}
    });

    expect(result.fieldsToWrite.zone).toBe('Madrid centro');
  });

  test('does not overwrite existing non-empty values', () => {
    const result = planWriteback({
      clientRecord: {
        service_interest: 'Soft Gel',
        zone: 'Salamanca'
      },
      intentData: { location_hint: 'Madrid centro' },
      resolvedServiceKey: 'soft_gel',
      resolvedServiceData: { display_name: 'Soft Gel' },
      enrichedProfileContext: { service_interest: 'soft gel' }
    });

    expect(result.shouldWrite).toBe(false);
    expect(result.fieldsToWrite).toEqual({});
  });
});
