const { appendAutomationLog } = require('./googleSheetsService');

async function logAutomationEvent(logEntry) {
  try {
    await appendAutomationLog(logEntry);
  } catch (error) {
    console.error('Failed to append automation log:', error.message);
  }
}

module.exports = {
  logAutomationEvent
};
