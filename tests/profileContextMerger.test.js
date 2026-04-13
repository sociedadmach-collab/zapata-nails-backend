const { mergeIntentIntoProfileContext } = require('../src/utils/profileContextMerger');

describe('profileContextMerger', () => {
  test('merges inferred service interest and zone into empty profile context', () => {
    const result = mergeIntentIntoProfileContext({
      clientRecord: null,
      intentData: {
        service_interest: 'soft gel',
        location_hint: 'Madrid centro'
      }
    });

    expect(result.service_interest).toBe('soft gel');
    expect(result.zone).toBe('Madrid centro');
  });

  test('does not overwrite existing non-empty profile values', () => {
    const result = mergeIntentIntoProfileContext({
      clientRecord: {
        service_interest: 'acrylic',
        zone: 'Salamanca'
      },
      intentData: {
        service_interest: 'soft gel',
        location_hint: 'Madrid centro'
      }
    });

    expect(result.service_interest).toBe('acrylic');
    expect(result.zone).toBe('Salamanca');
  });

  test('fills missing stored fields when existing values are empty', () => {
    const result = mergeIntentIntoProfileContext({
      clientRecord: {
        service_interest: '',
        zone: ''
      },
      intentData: {
        service_interest: 'nail art',
        location_hint: 'Chamberi'
      }
    });

    expect(result.service_interest).toBe('nail art');
    expect(result.zone).toBe('Chamberi');
  });
});
