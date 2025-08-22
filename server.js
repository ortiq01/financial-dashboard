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

// Redirect root to a default report path (configurable)
const DEFAULT_PATH = process.env.DEFAULT_PATH || '/reports/financial_dashboard_complete.html';

app.get('/', (req, res) => {
  // Use 302 to allow interim, can be set to 301 once stable
  res.redirect(DEFAULT_PATH);
});

// Optional lightweight status page
app.get('/status', (req, res) => {
  res.type('text/plain').send('financial-dashboard: ok');
});

app.listen(port, () => {
  console.log('financial-dashboard listening on :' + port);
});
