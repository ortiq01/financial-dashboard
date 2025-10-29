import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Root redirect settings
const DEFAULT_PATH = process.env.DEFAULT_PATH || '/reports/unified_dashboard.html';
const DISABLE_ROOT_REDIRECT = process.env.DISABLE_ROOT_REDIRECT === '1';

// Redirect legacy report paths BEFORE static so redirect wins even if files exist
const earlyLegacyReports = new Set([
  '/reports/dynamic_financial_dashboard.html',
  '/reports/enhanced_financial_dashboard.html',
  '/reports/enhanced_financial_dashboard_v12.html',
  '/reports/financial_analysis_report.html',
  '/reports/fixed_financial_dashboard.html',
  '/reports/financial_dashboard_complete.html'
]);
app.use((req, res, next) => {
  if (earlyLegacyReports.has(req.path)){
    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    return res.redirect(302, '/reports/unified_dashboard.html' + qs);
  }
  // Handle root redirect before static so index.html isn't served when redirect is enabled
  if (req.path === '/'){
    const noRedirect = DISABLE_ROOT_REDIRECT || req.query.hasOwnProperty('noredirect');
    if (!noRedirect){
      return res.redirect(DEFAULT_PATH);
    }
  }
  next();
});

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financial-dashboard', ts: new Date().toISOString() });
});

// Root route: serve landing when redirect disabled via query or env
app.get('/', (req, res) => {
  // If we reached here, either redirect is disabled or noredirect was used
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Explicit portal route so /portal serves index.html without trailing slash
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

// Optional lightweight status page
app.get('/status', (req, res) => {
  res.type('text/plain').send('financial-dashboard: ok');
});

// --- GoCardless sync API
import cron from 'node-cron';
import { triggerSync, getStatus } from './services/sync.js';
import { GoCardlessBADClient } from './services/gocardless.js';

// Allow POST to trigger a manual sync (optionally pass accountIds[])
app.use(express.json());
app.post('/api/sync/run', async (req, res) => {
  const secretId = process.env.GC_BAD_SECRET_ID;
  const secretKey = process.env.GC_BAD_SECRET_KEY;
  const accountIds = req.body?.accountIds || (process.env.GC_BAD_ACCOUNT_IDS ? process.env.GC_BAD_ACCOUNT_IDS.split(',') : []);
  if (!secretId || !secretKey) return res.status(400).json({ ok: false, error: 'Missing GC_BAD_SECRET_ID/GC_BAD_SECRET_KEY' });
  try {
    const status = await triggerSync({ secretId, secretKey, accountIds });
    res.json(status);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/sync/status', (req, res) => {
  res.json(getStatus());
});

// Schedule: run on 1st and 15th at 03:00 server time
if (process.env.ENABLE_SYNC_CRON === '1') {
  cron.schedule('0 3 1,15 * *', async () => {
    const secretId = process.env.GC_BAD_SECRET_ID;
    const secretKey = process.env.GC_BAD_SECRET_KEY;
    const accountIds = process.env.GC_BAD_ACCOUNT_IDS ? process.env.GC_BAD_ACCOUNT_IDS.split(',') : [];
    if (!secretId || !secretKey) return;
    try { await triggerSync({ secretId, secretKey, accountIds }); } catch {}
  });
}

// Helper endpoints to discover requisitions and accounts (for setup)
app.get('/api/gc/requisitions', async (req, res) => {
  const secretId = process.env.GC_BAD_SECRET_ID;
  const secretKey = process.env.GC_BAD_SECRET_KEY;
  if (!secretId || !secretKey) return res.status(400).json({ ok:false, error:'Missing GC_BAD_SECRET_ID/GC_BAD_SECRET_KEY' });
  try {
    const client = new GoCardlessBADClient({ secretId, secretKey });
    const data = await client.listRequisitions();
    res.json({ ok:true, ...data });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.response?.data || e.message });
  }
});

app.get('/api/gc/requisitions/:id', async (req, res) => {
  const secretId = process.env.GC_BAD_SECRET_ID;
  const secretKey = process.env.GC_BAD_SECRET_KEY;
  if (!secretId || !secretKey) return res.status(400).json({ ok:false, error:'Missing GC_BAD_SECRET_ID/GC_BAD_SECRET_KEY' });
  try {
    const client = new GoCardlessBADClient({ secretId, secretKey });
    const data = await client.getRequisition(req.params.id);
    res.json({ ok:true, ...data });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.response?.data || e.message });
  }
});

// Redirect legacy report paths to unified dashboard, preserving query string
const legacyReports = [
  '/reports/dynamic_financial_dashboard.html',
  '/reports/enhanced_financial_dashboard.html',
  '/reports/enhanced_financial_dashboard_v12.html',
  '/reports/financial_analysis_report.html',
  '/reports/fixed_financial_dashboard.html'
 , '/reports/financial_dashboard_complete.html'
];
legacyReports.forEach(p => app.get(p, (req, res) => {
  const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  res.redirect(302, '/reports/unified_dashboard.html' + qs);
}));

app.listen(port, () => {
  console.log('financial-dashboard listening on :' + port);
});
