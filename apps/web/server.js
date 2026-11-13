// cPanel Passenger Entry Point for OmniFlow Web (Next.js 15)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

function logError(title, err) {
  const logMsg = `\n======================================================\n[${new Date().toISOString()}] ${title}:\n${err?.stack || err}\n======================================================\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'cpanel_web_crash.log'), logMsg);
  } catch (_) {}
  console.error(logMsg);
}

process.on('uncaughtException', (err) => logError('WEB UNCAUGHT EXCEPTION', err));
process.on('unhandledRejection', (reason) => logError('WEB UNHANDLED REJECTION', reason));

const dev = false;
const port = process.env.PORT || 3000;
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) {
      logError('WEB SERVER LISTEN ERROR', err);
      throw err;
    }
    console.log(`> Next.js Web ready on port ${port}`);
  });
}).catch((err) => {
  logError('FAILED TO PREPARE NEXT APP', err);
});
