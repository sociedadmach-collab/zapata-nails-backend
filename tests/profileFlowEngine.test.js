const { determineNextProfileStep } = require('../src/utils/profileFlowEngine');
const { CLIENT_STATUS, PROFILE_STATUS } = require('../src/constants/clientStatus');
const { SALES_ROUTE } = require('../src/constants/salesRoutes');

describe('profileFlowEngine', () => {
  test('prioritizes service for new client', () => {
    const result = determineNextProfileStep({
      clientRecord: {
        display_name: 'Mady'
      },
      clientStatus: CLIENT_STATUS.NEW,
      profileStatus: PROFILE_STATUS.INCOMPLETE,
      salesRoute: SALES_ROUTE.ROUTE_NEW_ONBOARDING
    });

    expect(result.next_profile_step).toBe('ask_service');
    expect(result.missing_required_fields).toContain('service_interest');
    expect(result.priority).toBe('high');
  });

  test('asks for name when existing client has no display_name', () => {
    const result = determineNextProfileStep({
      clientRecord: {
        service_interest: 'gel nails'
      },
      clientStatus: CLIENT_STATUS.EXISTING,
      profileStatus: PROFILE_STATUS.INCOMPLETE,
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_PROFILE_COMPLETION
    });

    expect(result.next_profile_step).toBe('ask_name');
    expect(result.missing_required_fields).toContain('display_name');
    expect(result.priority).toBe('high');
  });

  test('asks for birthdate when client is ready to sell but birthdate is missing', () => {
    const result = determineNextProfileStep({
      clientRecord: {
        display_name: 'Mady',
        service_interest: 'gel nails',
        zone: 'Madrid'
      },
      clientStatus: CLIENT_STATUS.EXISTING,
      profileStatus: PROFILE_STATUS.COMPLETE,
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE
    });

    expect(result.next_profile_step).toBe('ask_birthdate');
    expect(result.missing_optional_fields).toContain('birthdate');
    expect(result.priority).toBe('low');
  });

  test('returns ready_to_book for complete enriched client', () => {
    const result = determineNextProfileStep({
      clientRecord: {
        display_name: 'Mady',
        service_interest: 'gel nails',
        zone: 'Madrid',
        birthdate: '1992-08-10'
      },
      clientStatus: CLIENT_STATUS.EXISTING,
      profileStatus: PROFILE_STATUS.COMPLETE,
      salesRoute: SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE
    });

    expect(result.next_profile_step).toBe('ready_to_book');
    expect(result.missing_required_fields).toEqual([]);
  });
});
