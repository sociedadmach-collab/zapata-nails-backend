const { env, validateEnvironment } = require('../src/config/env');
const { getSheetsClient, mapGoogleSheetsError } = require('../src/config/googleSheets');

async function main() {
  const validation = validateEnvironment();

  if (!validation.ok) {
    console.error('Environment validation failed.');
    console.error(validation.message);
    process.exit(1);
  }

  try {
    const sheets = getSheetsClient();
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: env.spreadsheetId,
      includeGridData: false
    });

    const sheetTitles = (metadata.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean);

    console.log('Google Sheets connection OK.');
    console.log(`Spreadsheet title: ${metadata.data.properties?.title || '(untitled)'}`);
    console.log(`Available tabs: ${sheetTitles.join(', ') || '(none found)'}`);

    const requiredTabs = [env.clientesSheetName, env.automationLogSheetName];
    const missingTabs = requiredTabs.filter((name) => !sheetTitles.includes(name));

    if (missingTabs.length > 0) {
      console.error(`Missing required tabs: ${missingTabs.join(', ')}`);
      process.exit(1);
    }

    console.log(`Required tabs found: ${requiredTabs.join(', ')}`);
  } catch (error) {
    const mappedError = mapGoogleSheetsError(error, { sheetName: env.clientesSheetName });
    console.error('Google Sheets connection failed.');
    console.error(mappedError.message);
    if (mappedError.details) {
      console.error(`Details: ${mappedError.details}`);
    }
    process.exit(1);
  }
}

main();
