const { deriveLoyaltySignals } = require('../src/utils/loyaltySignals');

describe('loyaltySignals', () => {
  const processedAt = '2026-04-11T10:00:00Z';

  test('detects VIP client manually flagged', () => {
    expect(
      deriveLoyaltySignals({
        clientRecord: { vip_status: 'VIP' },
        processedAt
      }).isVipClient
    ).toBe(true);
  });

  test('detects birthday known', () => {
    expect(
      deriveLoyaltySignals({
        clientRecord: { birthdate: '1992-08-10' },
        processedAt
      }).birthdayKnown
    ).toBe(true);
  });

  test('detects birthday upcoming within 30 days', () => {
    expect(
      deriveLoyaltySignals({
        clientRecord: { birthdate: '1992-04-25' },
        processedAt
      }).birthdayUpcoming
    ).toBe(true);
  });

  test('detects favorite service known', () => {
    expect(
      deriveLoyaltySignals({
        clientRecord: { service_interest: 'Soft Gel' },
        processedAt
      }).favoriteServiceKnown
    ).toBe(true);
  });

  test('detects reactivation candidate after 45 days', () => {
    expect(
      deriveLoyaltySignals({
        clientRecord: { last_visit: '2026-01-10T10:00:00Z' },
        processedAt
      }).reactivationCandidate
    ).toBe(true);
  });

  test('returns false for invalid birthdate', () => {
    const result = deriveLoyaltySignals({
      clientRecord: { birthdate: 'not-a-date' },
      processedAt
    });

    expect(result.birthdayKnown).toBe(true);
    expect(result.birthdayUpcoming).toBe(false);
  });

  test('returns false for missing last_visit', () => {
    expect(
      deriveLoyaltySignals({
        clientRecord: {},
        processedAt
      }).reactivationCandidate
    ).toBe(false);
  });
});
