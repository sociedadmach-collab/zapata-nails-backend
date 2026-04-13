const crypto = require('crypto');

function formatDateForClientId(timestamp) {
  const date = new Date(timestamp);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function generateClientId(timestamp = new Date().toISOString()) {
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CL-${formatDateForClientId(timestamp)}-${randomSuffix}`;
}

function buildClientRecordForCreate({ timestamp, phoneNormalized, displayName, headers, clientId }) {
  const supportedHeaders = new Set(headers);
  const record = {
    client_id: clientId || generateClientId(timestamp),
    phone_normalized: phoneNormalized,
    display_name: displayName || '',
    // birthdate is a loyalty/enrichment field and is intentionally optional at creation time.
    birthdate: '',
    // email remains optional and secondary to birthdate for future enrichment flows.
    email: '',
    notes: ''
  };

  if (supportedHeaders.has('created_at')) {
    record.created_at = timestamp;
  }

  if (supportedHeaders.has('last_interaction_at')) {
    record.last_interaction_at = timestamp;
  }

  return record;
}

function buildClientRecordForUpdate(existingClient, { timestamp, displayName, headers }) {
  const supportedHeaders = new Set(headers);
  const updatedRecord = {
    ...existingClient
  };

  if (supportedHeaders.has('display_name') && displayName && displayName !== existingClient.display_name) {
    updatedRecord.display_name = displayName;
  }

  if (supportedHeaders.has('last_interaction_at')) {
    updatedRecord.last_interaction_at = timestamp;
  }

  // Preserve birthdate and email if they already exist in the sheet.
  if (supportedHeaders.has('birthdate') && existingClient.birthdate !== undefined) {
    updatedRecord.birthdate = existingClient.birthdate;
  }

  if (supportedHeaders.has('email') && existingClient.email !== undefined) {
    updatedRecord.email = existingClient.email;
  }

  return updatedRecord;
}

function buildAutomationLogRecord({ headers, logEntry }) {
  const supportedHeaders = new Set(headers);
  const record = {};

  if (supportedHeaders.has('request_id')) record.request_id = logEntry.request_id;
  if (supportedHeaders.has('timestamp')) record.timestamp = logEntry.timestamp;
  if (supportedHeaders.has('module')) record.module = logEntry.module;
  if (supportedHeaders.has('status')) record.status = logEntry.status;
  if (supportedHeaders.has('phone_raw')) record.phone_raw = logEntry.phone_raw;
  if (supportedHeaders.has('phone_normalized')) record.phone_normalized = logEntry.phone_normalized;
  if (supportedHeaders.has('next_route')) record.next_route = logEntry.next_route;
  if (supportedHeaders.has('error_code')) record.error_code = logEntry.error_code || '';
  if (supportedHeaders.has('error_message')) record.error_message = logEntry.error_message || '';
  if (supportedHeaders.has('persistence_ok')) {
    record.persistence_ok =
      typeof logEntry.persistence_ok === 'boolean' ? String(logEntry.persistence_ok) : '';
  }
  if (supportedHeaders.has('persistence_action')) {
    record.persistence_action = logEntry.persistence_action || '';
  }
  if (supportedHeaders.has('matched_records')) {
    record.matched_records = String(logEntry.matched_records ?? '');
  }
  if (supportedHeaders.has('source')) record.source = logEntry.source || '';

  return record;
}

module.exports = {
  generateClientId,
  buildClientRecordForCreate,
  buildClientRecordForUpdate,
  buildAutomationLogRecord
};
