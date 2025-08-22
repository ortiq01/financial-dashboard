import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financial-dashboard', ts: new Date().toISOString() });
});

// Root route: by default redirect to a default report, but allow disabling
const DEFAULT_PATH = process.env.DEFAULT_PATH || '/reports/dynamic_financial_dashboard.html';
const DISABLE_ROOT_REDIRECT = process.env.DISABLE_ROOT_REDIRECT === '1';

app.get('/', (req, res) => {
  const noRedirect = DISABLE_ROOT_REDIRECT || 'noredirect' in req.query;
  if (!noRedirect) {
    // 302 keeps it temporary and cache-safe behind proxies
    return res.redirect(DEFAULT_PATH);
  }
  // Serve a simple landing page with links
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Optional lightweight status page
app.get('/status', (req, res) => {
  res.type('text/plain').send('financial-dashboard: ok');
});

app.listen(port, () => {
  console.log('financial-dashboard listening on :' + port);
});
