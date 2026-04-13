const { google } = require('googleapis');
const { env } = require('./env');

let sheetsClient;
let jwtAuthClient;

function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const auth = getJwtAuthClient();

  sheetsClient = google.sheets({
    version: 'v4',
    auth
  });

  return sheetsClient;
}

function getJwtAuthClient() {
  if (jwtAuthClient) {
    return jwtAuthClient;
  }

  jwtAuthClient = new google.auth.JWT({
    email: env.googleServiceAccountEmail,
    key: env.googlePrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return jwtAuthClient;
}

function mapGoogleSheetsError(error, context = {}) {
  const status = error?.code || error?.response?.status;
  const apiMessage = error?.response?.data?.error?.message || error?.message || 'Unknown Google Sheets error';
  const sheetName = context.sheetName;

  if (isAuthenticationError(error, apiMessage)) {
    return createSheetsError(
      'GOOGLE_AUTHENTICATION_FAILED',
      'Google authentication failed. Verify GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY, and make sure the private key was pasted with \\n line breaks.',
      apiMessage
    );
  }

  if (status === 403) {
    return createSheetsError(
      'GOOGLE_SHEETS_PERMISSION_DENIED',
      `Google Sheets access denied. Share the spreadsheet with the service account email (${env.googleServiceAccountEmail}) and confirm it has access.`,
      apiMessage
    );
  }

  if (status === 404) {
    return createSheetsError(
      'GOOGLE_SHEETS_NOT_FOUND',
      `Spreadsheet not found. Verify GOOGLE_SHEETS_SPREADSHEET_ID and confirm the service account can access the file.`,
      apiMessage
    );
  }

  if (typeof apiMessage === 'string' && apiMessage.includes('Unable to parse range')) {
    return createSheetsError(
      'GOOGLE_SHEETS_TAB_NOT_FOUND',
      `Sheet tab not found for "${sheetName}". Verify the exact tab name in .env. Expected names are CLIENTES and AUTOMATION_LOG unless you changed them intentionally.`,
      apiMessage
    );
  }

  return createSheetsError(
    'GOOGLE_SHEETS_REQUEST_FAILED',
    'Google Sheets request failed. Verify spreadsheet ID, service account permissions, tab names, and private key formatting.',
    apiMessage
  );
}

function isAuthenticationError(error, apiMessage) {
  if (error?.code === 'invalid_grant' || error?.code === 'invalid_client') {
    return true;
  }

  if (typeof apiMessage !== 'string') {
    return false;
  }

  return [
    'invalid_grant',
    'invalid_client',
    'unauthorized_client',
    'error:1e08010c',
    'DECODER routines',
    'private key'
  ].some((token) => apiMessage.toLowerCase().includes(token.toLowerCase()));
}

async function runGoogleSheetsStartupCheck() {
  const auth = getJwtAuthClient();
  const sheets = getSheetsClient();

  try {
    await auth.authorize();
  } catch (error) {
    throw mapGoogleSheetsError(error);
  }

  let metadata;

  try {
    metadata = await sheets.spreadsheets.get({
      spreadsheetId: env.spreadsheetId,
      includeGridData: false
    });
  } catch (error) {
    throw mapGoogleSheetsError(error);
  }

  const sheetTitles = (metadata.data.sheets || [])
    .map((sheet) => sheet.properties?.title)
    .filter(Boolean);

  const requiredTabs = [env.clientesSheetName, env.automationLogSheetName];
  const missingTabs = requiredTabs.filter((title) => !sheetTitles.includes(title));

  if (missingTabs.length > 0) {
    throw createSheetsError(
      'GOOGLE_SHEETS_TAB_NOT_FOUND',
      `Required sheet tab(s) not found: ${missingTabs.join(', ')}. Verify the exact tab names in Google Sheets and in your .env.`,
      `Available tabs: ${sheetTitles.join(', ') || '(none found)'}`
    );
  }

  return {
    spreadsheetTitle: metadata.data.properties?.title || '',
    availableTabs: sheetTitles
  };
}

function createSheetsError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

module.exports = {
  getSheetsClient,
  getJwtAuthClient,
  mapGoogleSheetsError,
  runGoogleSheetsStartupCheck
};
