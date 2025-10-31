import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import { getSavings, updateSavings, getSavingsHistory, getTotalSavings } from './services/savings.js';

// Load env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Body parser middleware
app.use(express.json());

// Root landing/redirect settings
// Default behavior: serve the Portal at '/'
// You can opt back into redirects by setting DISABLE_ROOT_REDIRECT=0 and optionally DEFAULT_PATH
const DEFAULT_PATH = process.env.DEFAULT_PATH || '/portal';
const DISABLE_ROOT_REDIRECT = process.env.DISABLE_ROOT_REDIRECT === '0' ? false : true;

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
  // Handle optional root redirect (disabled by default). When enabled, '/' will redirect to DEFAULT_PATH.
  if (req.path === '/'){
    const noRedirect = DISABLE_ROOT_REDIRECT || req.query.hasOwnProperty('noredirect');
    if (!noRedirect) return res.redirect(DEFAULT_PATH);
  }
  next();
});

// Serve static files from public/ but disable automatic index.html at '/'
// so our custom root route can serve the Portal.
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- Data listing and upload endpoints ---
// Global default whitelist
const DEFAULT_DATA_EXT = new Set(['.csv', '.tsv', '.tab', '.txt', '.json']);

const ACCOUNTS_CFG_PATH = path.join(__dirname, 'public', 'config', 'accounts.json');
function readAccountsConfig(){
  try{ return JSON.parse(fs.readFileSync(ACCOUNTS_CFG_PATH, 'utf8')); }
  catch{ return { accounts: [] }; }
}
function allowedExtForAccount(accountId){
  if (!accountId) return new Set(DEFAULT_DATA_EXT);
  const cfg = readAccountsConfig();
  const acc = (cfg.accounts || []).find(a => a.id === accountId);
  if (!acc || !Array.isArray(acc.allowedExt) || acc.allowedExt.length === 0){
    return new Set(DEFAULT_DATA_EXT);
  }
  const s = new Set();
  for (const e of acc.allowedExt){
    const v = (e || '').toString().trim().toLowerCase();
    if (!v) continue;
    s.add(v.startsWith('.') ? v : ('.' + v));
  }
  return s.size ? s : new Set(DEFAULT_DATA_EXT);
}

// List available data files under public/data (recursively)
app.get('/data/list', async (req, res) => {
  try {
    const accountId = req.query.account;
    const base = accountId
      ? path.join(__dirname, 'public', 'data', 'accounts', accountId)
      : path.join(__dirname, 'public', 'data');
    const items = [];
    const allowed = allowedExtForAccount(accountId);
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })){
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        const ext = path.extname(entry.name).toLowerCase();
        if (allowed.has(ext)){
          const rel = full.substring(base.length).replace(/\\/g,'/');
          items.push({
            name: entry.name,
            path: (accountId ? `/data/accounts/${accountId}` : '/data') + rel,
            size: fs.statSync(full).size
          });
        }
      }
    };
    if (fs.existsSync(base)) walk(base);
    items.sort((a,b) => a.name.localeCompare(b.name));
    res.json({ ok:true, files: items });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

// Configure upload storage to public/data/uploads/YYYY-MM-DD
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const d = new Date();
    const accountId = req.query.account;
    const root = accountId
      ? path.join(__dirname, 'public', 'data', 'accounts', accountId, 'uploads')
      : path.join(__dirname, 'public', 'data', 'uploads');
    const folder = path.join(root, d.toISOString().slice(0,10));
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^A-Za-z0-9._-]+/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = allowedExtForAccount(req.query.account);
    if (allowed.has(ext)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  }
});

// Upload endpoint: returns URL path under /data/uploads/...
app.post('/upload', upload.single('file'), (req, res) => {
  try{
    const full = req.file.path;
    const base = path.join(__dirname, 'public');
    const rel = full.substring(base.length).replace(/\\/g,'/');
    res.json({ ok:true, path: rel, account: req.query.account || null });
  } catch(e){
    res.status(500).json({ ok:false, error: e.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financial-dashboard', ts: new Date().toISOString() });
});

// Root route: serve landing when redirect disabled via query or env
app.get('/', (req, res) => {
  // If we reach here, redirect is disabled (default). Serve the Portal at root.
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

// Explicit portal route so /portal serves index.html without trailing slash
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

// Portal route (without .html extension)
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
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

// --- Savings API endpoints ---
// Get all savings accounts
app.get('/api/savings', async (req, res) => {
  try {
    const savings = await getSavings();
    const total = await getTotalSavings();
    res.json({ ok: true, savings, total });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Update savings account
app.post('/api/savings', async (req, res) => {
  try {
    const { accountName, accountType, institution, amount } = req.body;
    
    if (!accountName || !accountType || !institution || amount === undefined) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: accountName, accountType, institution, amount' 
      });
    }

    const saved = await updateSavings(accountName, accountType, institution, parseFloat(amount));
    const total = await getTotalSavings();
    
    res.json({ ok: true, savings: saved, total });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get savings history for an account
app.get('/api/savings/history/:accountName', async (req, res) => {
  try {
    const { accountName } = req.params;
    const days = parseInt(req.query.days) || 30;
    const history = await getSavingsHistory(accountName, days);
    res.json({ ok: true, history });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
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
