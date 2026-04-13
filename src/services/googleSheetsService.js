const { getSheetsClient, mapGoogleSheetsError } = require('../config/googleSheets');
const { env } = require('../config/env');
const {
  generateClientId,
  buildClientRecordForCreate,
  buildClientRecordForUpdate,
  buildAutomationLogRecord
} = require('../utils/persistence');

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function mapRows(headers, rows) {
  return rows.map((row, index) => {
    const record = {};

    headers.forEach((header, index) => {
      record[normalizeHeader(header)] = row[index] || '';
    });

    record.__rowNumber = index + 2;

    return record;
  });
}

function normalizeHeaders(headers) {
  return headers.map((header) => normalizeHeader(header));
}

async function getSheetValues(sheetName) {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A:ZZ`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range
    });

    return response.data.values || [];
  } catch (error) {
    throw mapGoogleSheetsError(error, { sheetName });
  }
}

async function updateSheetRow(sheetName, rowNumber, rowValues) {
  const sheets = getSheetsClient();

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues]
      }
    });
  } catch (error) {
    throw mapGoogleSheetsError(error, { sheetName });
  }
}

async function appendSheetRow(sheetName, rowValues) {
  const sheets = getSheetsClient();

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues]
      }
    });
  } catch (error) {
    throw mapGoogleSheetsError(error, { sheetName });
  }
}

async function getClientSheetData() {
  return getSheetData(env.clientesSheetName);
}

async function getAutomationLogSheetData() {
  return getSheetData(env.automationLogSheetName);
}

async function getSheetData(sheetName) {
  const values = await getSheetValues(sheetName);

  if (values.length === 0) {
    return {
      headers: [],
      normalizedHeaders: [],
      records: []
    };
  }

  const [headers, ...rows] = values;

  return {
    headers,
    normalizedHeaders: normalizeHeaders(headers),
    records: mapRows(headers, rows)
  };
}

function buildSheetRow(headers, record) {
  return headers.map((header) => {
    const key = normalizeHeader(header);
    return record[key] ?? '';
  });
}

async function findClientsByPhone(phoneNormalized) {
  const { records } = await getClientSheetData();
  return records.filter((row) => row.phone_normalized === phoneNormalized);
}

async function createClient({ phoneNormalized, displayName, lastVisit }) {
  const { headers, normalizedHeaders, records } = await getClientSheetData();

  if (headers.length === 0) {
    throw new Error('CLIENTES sheet is empty or missing header row.');
  }

  const clientRecord = buildClientRecordForCreate({
    timestamp: lastVisit,
    phoneNormalized,
    displayName,
    headers: normalizedHeaders,
    clientId: generateClientId(lastVisit)
  });

  await appendSheetRow(env.clientesSheetName, buildSheetRow(headers, clientRecord));

  return {
    ...clientRecord,
    __rowNumber: records.length + 2
  };
}

async function updateClient(existingClient, { displayName, lastVisit }) {
  const { headers, normalizedHeaders } = await getClientSheetData();

  if (headers.length === 0) {
    throw new Error('CLIENTES sheet is empty or missing header row.');
  }

  const updatedClient = buildClientRecordForUpdate(existingClient, {
    displayName,
    timestamp: lastVisit,
    headers: normalizedHeaders
  });

  await updateSheetRow(
    env.clientesSheetName,
    existingClient.__rowNumber,
    buildSheetRow(headers, updatedClient)
  );

  return updatedClient;
}

async function updateClientFields(existingClient, fieldsToWrite) {
  const { headers } = await getClientSheetData();

  if (headers.length === 0) {
    throw new Error('CLIENTES sheet is empty or missing header row.');
  }

  const updatedClient = {
    ...existingClient,
    ...fieldsToWrite
  };

  await updateSheetRow(
    env.clientesSheetName,
    existingClient.__rowNumber,
    buildSheetRow(headers, updatedClient)
  );

  return updatedClient;
}

async function appendAutomationLog(logEntry) {
  const { headers, normalizedHeaders } = await getAutomationLogSheetData();

  if (headers.length === 0) {
    throw new Error('AUTOMATION_LOG sheet is empty or missing header row.');
  }

  const fallbackHeaders = [
    'request_id',
    'timestamp',
    'module',
    'status',
    'phone_raw',
    'phone_normalized',
    'next_route',
    'error_code'
  ];

  const effectiveHeaders = normalizedHeaders.length > 0 ? normalizedHeaders : fallbackHeaders;
  const record = buildAutomationLogRecord({
    headers: effectiveHeaders,
    logEntry
  });

  await appendSheetRow(env.automationLogSheetName, buildSheetRow(headers, record));
}

module.exports = {
  createClient,
  findClientsByPhone,
  appendAutomationLog,
  getClientSheetData,
  getAutomationLogSheetData,
  updateClient,
  updateClientFields
};
