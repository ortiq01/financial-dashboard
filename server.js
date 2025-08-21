import express from 'express';

const app = express();
const port = process.env.PORT || 3002;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financial-dashboard', ts: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Financial Dashboard API');
});

app.listen(port, () => {
  console.log(`financial-dashboard listening on :${port}`);
});
