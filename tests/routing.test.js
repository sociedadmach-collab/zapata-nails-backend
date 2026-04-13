const { determineNextRoute } = require('../src/utils/routing');
const { CLIENT_STATUS, PROFILE_STATUS } = require('../src/constants/clientStatus');
const { NEXT_ROUTE } = require('../src/constants/routes');

describe('routing utils', () => {
  test('routes new clients to onboarding', () => {
    expect(
      determineNextRoute({
        clientStatus: CLIENT_STATUS.NEW,
        profileStatus: PROFILE_STATUS.INCOMPLETE
      })
    ).toBe(NEXT_ROUTE.NEW_CLIENT_ONBOARDING);
  });

  test('routes complete existing clients to welcome', () => {
    expect(
      determineNextRoute({
        clientStatus: CLIENT_STATUS.EXISTING,
        profileStatus: PROFILE_STATUS.COMPLETE
      })
    ).toBe(NEXT_ROUTE.EXISTING_CLIENT_WELCOME);
  });

  test('routes partial existing clients to profile completion', () => {
    expect(
      determineNextRoute({
        clientStatus: CLIENT_STATUS.EXISTING,
        profileStatus: PROFILE_STATUS.PARTIAL
      })
    ).toBe(NEXT_ROUTE.PROFILE_COMPLETION);
  });

  test('routes duplicates to manual review', () => {
    expect(
      determineNextRoute({
        clientStatus: CLIENT_STATUS.DUPLICATE,
        profileStatus: PROFILE_STATUS.PARTIAL
      })
    ).toBe(NEXT_ROUTE.MANUAL_REVIEW_FALLBACK);
  });

  test('routes technical errors to technical fallback', () => {
    expect(
      determineNextRoute({
        clientStatus: CLIENT_STATUS.ERROR,
        profileStatus: PROFILE_STATUS.INCOMPLETE,
        hasTechnicalError: true
      })
    ).toBe(NEXT_ROUTE.TECHNICAL_FALLBACK);
  });
});
