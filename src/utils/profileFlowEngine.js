const { CLIENT_STATUS, PROFILE_STATUS } = require('../constants/clientStatus');
const { SALES_ROUTE } = require('../constants/salesRoutes');

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function determineNextProfileStep({
  clientRecord,
  clientStatus,
  profileStatus,
  salesRoute
}) {
  const record = clientRecord || {};

  const missingRequiredFields = [];
  const missingOptionalFields = [];

  if (!hasValue(record.display_name)) {
    missingRequiredFields.push('display_name');
  }

  if (!hasValue(record.service_interest)) {
    missingRequiredFields.push('service_interest');
  }

  if (!hasValue(record.zone)) {
    missingOptionalFields.push('zone');
  }

  if (!hasValue(record.birthdate)) {
    missingOptionalFields.push('birthdate');
  }

  if (clientStatus === CLIENT_STATUS.NEW) {
    if (missingRequiredFields.includes('service_interest')) {
      return {
        next_profile_step: 'ask_service',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'high'
      };
    }

    if (missingRequiredFields.includes('display_name')) {
      return {
        next_profile_step: 'ask_name',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'medium'
      };
    }

    if (missingOptionalFields.includes('zone')) {
      return {
        next_profile_step: 'ask_zone',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'medium'
      };
    }

    return {
      next_profile_step: 'ready_to_book',
      missing_required_fields: missingRequiredFields,
      missing_optional_fields: missingOptionalFields,
      priority: 'low'
    };
  }

  if (
    clientStatus === CLIENT_STATUS.EXISTING &&
    profileStatus !== PROFILE_STATUS.COMPLETE
  ) {
    if (missingRequiredFields.includes('display_name')) {
      return {
        next_profile_step: 'ask_name',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'high'
      };
    }

    if (missingRequiredFields.includes('service_interest')) {
      return {
        next_profile_step: 'ask_service',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'high'
      };
    }

    if (missingOptionalFields.includes('zone')) {
      return {
        next_profile_step: 'ask_zone',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'medium'
      };
    }

    if (missingOptionalFields.includes('birthdate')) {
      return {
        next_profile_step: 'ask_birthdate',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'low'
      };
    }
  }

  if (
    clientStatus === CLIENT_STATUS.EXISTING &&
    (profileStatus === PROFILE_STATUS.COMPLETE ||
      salesRoute === SALES_ROUTE.ROUTE_EXISTING_DIRECT_SALE)
  ) {
    if (missingOptionalFields.includes('birthdate')) {
      return {
        next_profile_step: 'ask_birthdate',
        missing_required_fields: missingRequiredFields,
        missing_optional_fields: missingOptionalFields,
        priority: 'low'
      };
    }

    return {
      next_profile_step: 'ready_to_book',
      missing_required_fields: missingRequiredFields,
      missing_optional_fields: missingOptionalFields,
      priority: 'low'
    };
  }

  return {
    next_profile_step: 'ready_to_book',
    missing_required_fields: missingRequiredFields,
    missing_optional_fields: missingOptionalFields,
    priority: 'low'
  };
}

module.exports = {
  determineNextProfileStep
};
