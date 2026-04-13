const dotenv = require('dotenv');

dotenv.config();

function parseEnvValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim().replace(/^"(.*)"$/s, '$1').replace(/^'(.*)'$/s, '$1');
}

function parseMultilineEnvValue(value) {
  if (!value) {
    return '';
  }

  const normalized = parseEnvValue(value);

  if (!normalized) {
    return '';
  }

  return normalized.replace(/\\n/g, '\n');
}

const env = {
  port: Number(process.env.PORT || 3000),
  spreadsheetId: parseEnvValue(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
  googleServiceAccountEmail: parseEnvValue(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
  googlePrivateKey: parseMultilineEnvValue(process.env.GOOGLE_PRIVATE_KEY),
  openaiApiKey: parseEnvValue(process.env.OPENAI_API_KEY),
  openaiIntentModel: parseEnvValue(process.env.OPENAI_INTENT_MODEL) || 'gpt-4o-mini',
  openaiMessageModel: parseEnvValue(process.env.OPENAI_MESSAGE_MODEL) || 'gpt-4o-mini',
  clientesSheetName: parseEnvValue(process.env.CLIENTES_SHEET_NAME) || 'CLIENTES',
  automationLogSheetName: parseEnvValue(process.env.AUTOMATION_LOG_SHEET_NAME) || 'AUTOMATION_LOG',
  clientRequiredFields: (parseEnvValue(process.env.CLIENT_REQUIRED_FIELDS) || 'phone_normalized,display_name')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  clientOptionalFields: (parseEnvValue(process.env.CLIENT_OPTIONAL_FIELDS) || 'birthdate,email,last_visit,notes')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  logLevel: parseEnvValue(process.env.LOG_LEVEL) || 'info'
};

function validateEnvironment() {
  const missing = [];
  const invalid = [];

  if (!env.spreadsheetId) missing.push('GOOGLE_SHEETS_SPREADSHEET_ID');
  if (!env.googleServiceAccountEmail) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!env.googlePrivateKey) missing.push('GOOGLE_PRIVATE_KEY');
  if (env.googlePrivateKey && !env.googlePrivateKey.includes('BEGIN PRIVATE KEY')) {
    invalid.push('GOOGLE_PRIVATE_KEY');
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    missingByType: {
      spreadsheetId: missing.includes('GOOGLE_SHEETS_SPREADSHEET_ID'),
      serviceAccountEmail: missing.includes('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      privateKey: missing.includes('GOOGLE_PRIVATE_KEY')
    },
    message: buildEnvironmentValidationMessage({ missing, invalid })
  };
}

function buildEnvironmentValidationMessage({ missing, invalid }) {
  const messages = [];

  if (missing.length > 0) {
    messages.push(`Missing environment variables: ${missing.join(', ')}`);
  }

  if (missing.includes('GOOGLE_SHEETS_SPREADSHEET_ID')) {
    messages.push(
      'GOOGLE_SHEETS_SPREADSHEET_ID is empty. Copy the spreadsheet ID from the Google Sheets URL segment between /d/ and /edit.'
    );
  }

  if (missing.includes('GOOGLE_SERVICE_ACCOUNT_EMAIL')) {
    messages.push(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL is empty. Use the client_email value from your Google service account JSON.'
    );
  }

  if (missing.includes('GOOGLE_PRIVATE_KEY')) {
    messages.push(
      'GOOGLE_PRIVATE_KEY is empty. Use the private_key value from your Google service account JSON and keep line breaks as \\n inside the .env value.'
    );
  }

  if (invalid.includes('GOOGLE_PRIVATE_KEY')) {
    messages.push(
      'GOOGLE_PRIVATE_KEY does not look valid. Paste the full private key from the service account JSON and preserve line breaks using \\n inside the .env value.'
    );
  }

  return messages.join(' ');
}

module.exports = {
  env,
  validateEnvironment,
  parseEnvValue,
  parseMultilineEnvValue
};
