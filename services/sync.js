import fs from 'fs';
import path from 'path';
import { GoCardlessBADClient } from './gocardless.js';

const DATA_DIR = path.resolve(process.cwd(), 'public', 'data');
const SYNC_FILE = path.join(DATA_DIR, 'synced_transactions.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function loadJsonSafe(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Very simple dedupe by transactionId or endToEndId + amount + date
function txnKey(txn) {
  const id = txn.transactionId || txn.internalTransactionId || txn.endToEndId || '';
  const amt = txn.transactionAmount?.amount ?? txn.amount ?? '';
  const date = txn.bookingDate || txn.valueDate || txn.date || '';
  return `${id}|${amt}|${date}`;
}

export async function runSyncOnce({ secretId, secretKey, accountIds = [] }) {
  ensureDir(DATA_DIR);
  const client = new GoCardlessBADClient({ secretId, secretKey });

  const previous = loadJsonSafe(SYNC_FILE, { lastUpdated: null, transactions: [] });
  const oldByKey = new Map(previous.transactions.map(t => [txnKey(t), t]));

  // Auto-discover accounts from all requisitions if none provided
  let accountsToUse = Array.isArray(accountIds) ? accountIds.filter(Boolean) : [];
  let discovered = [];
  if (accountsToUse.length === 0) {
    try {
      const reqs = await client.listRequisitions();
      const list = Array.isArray(reqs?.results) ? reqs.results : (Array.isArray(reqs) ? reqs : []);
      const acctSet = new Set();
      for (const r of list) {
        const accts = Array.isArray(r?.accounts) ? r.accounts : [];
        accts.forEach(id => acctSet.add(id));
      }
      accountsToUse = Array.from(acctSet);
      discovered = accountsToUse.slice();
    } catch (e) {
      // ignore; will proceed with empty
    }
  }

  const allFetched = [];
  for (const accountId of accountsToUse) {
    try {
      const res = await client.getAccountTransactions(accountId, { include: 'booked' });
      const booked = res.transactions?.booked || res.booked || [];
      for (const t of booked) {
        // Normalize a few fields for downstream parser
        const norm = {
          ...t,
          _source: 'gocardless',
          accountId,
          amount: t.transactionAmount?.amount ?? t.amount,
          currency: t.transactionAmount?.currency ?? t.currency,
          date: t.bookingDate || t.valueDate || t.date,
          description: t.remittanceInformationUnstructured || t.remittanceInformationUnstructuredArray?.join(' ') || t.creditorName || t.debtorName || t.description || '',
        };
        allFetched.push(norm);
      }
    } catch (e) {
      console.error('Sync account failed', accountId, e?.response?.data || e.message);
    }
  }

  // Merge/dedupe
  for (const t of allFetched) {
    oldByKey.set(txnKey(t), { ...oldByKey.get(txnKey(t)), ...t });
  }
  const merged = Array.from(oldByKey.values());

  const out = { lastUpdated: new Date().toISOString(), transactions: merged, discoveredAccounts: discovered };
  fs.writeFileSync(SYNC_FILE, JSON.stringify(out, null, 2));
  return { added: allFetched.length, total: merged.length, file: SYNC_FILE, usedAccounts: accountsToUse };
}

let status = { lastRun: null, lastResult: null, running: false };
export async function triggerSync({ secretId, secretKey, accountIds = [] }) {
  if (status.running) return status;
  status.running = true;
  status.lastRun = new Date().toISOString();
  try {
    const res = await runSyncOnce({ secretId, secretKey, accountIds });
    status.lastResult = { ok: true, ...res };
  } catch (e) {
    status.lastResult = { ok: false, error: e.message };
  } finally {
    status.running = false;
  }
  return status;
}

export function getStatus() {
  return status;
}
