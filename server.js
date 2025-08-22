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

app.get('/', (req, res) => {
  res.send('Financial Dashboard API');
});

app.listen(port, () => {
  console.log('financial-dashboard listening on :' + port);
});
