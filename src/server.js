const app = require('./app');
const { env, validateEnvironment } = require('./config/env');
const { runGoogleSheetsStartupCheck } = require('./config/googleSheets');

function logStartupValidation() {
  const validation = validateEnvironment();

  if (validation.ok) {
    console.log('[startup] Environment configuration OK.');
    return true;
  }

  console.error('[startup] Google Sheets configuration issues detected.');
  console.error(`[startup] ${validation.message}`);

  return false;
}

async function runPostStartDiagnostics() {
  const validation = validateEnvironment();

  if (!validation.ok) {
    console.warn('[startup] Skipping Google Sheets connectivity check until missing configuration is completed.');
    return;
  }

  try {
    const result = await runGoogleSheetsStartupCheck();
    console.log(
      `[startup] Google Sheets connected: "${result.spreadsheetTitle || 'Untitled spreadsheet'}". Tabs found: ${result.availableTabs.join(', ')}`
    );
  } catch (error) {
    console.error(`[startup] ${error.code || 'GOOGLE_SHEETS_ERROR'}: ${error.message}`);
    if (error.details) {
      console.error(`[startup] Details: ${error.details}`);
    }
  }
}

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
  logStartupValidation();
  runPostStartDiagnostics();
});
