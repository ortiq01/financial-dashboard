import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Optional lightweight status page
app.get('/status', (req, res) => {
  res.type('text/plain').send('financial-dashboard: ok');
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
