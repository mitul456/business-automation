// cPanel Passenger Entry Point for OmniFlow API
const path = require('path');
const fs = require('fs');

// 1. Force load .env from the application directory
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn(`[cPanel Warning] .env file not found at ${envPath}`);
}

// 2. Comprehensive Crash Logger for cPanel debugging (writes to cpanel_crash.log)
function logError(title, err) {
  const logMsg = `\n======================================================\n[${new Date().toISOString()}] ${title}:\n${err?.stack || err}\n======================================================\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'cpanel_crash.log'), logMsg);
  } catch (_) {}
  console.error(logMsg);
}

process.on('uncaughtException', (err) => {
  logError('UNCAUGHT EXCEPTION ON STARTUP', err);
});

process.on('unhandledRejection', (reason) => {
  logError('UNHANDLED REJECTION ON STARTUP', reason);
});

// 3. Start NestJS API
try {
  require('./dist/main.js');
} catch (err) {
  logError('FAILED TO REQUIRE DIST/MAIN.JS', err);
  throw err;
}
