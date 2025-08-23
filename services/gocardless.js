// Minimal GoCardless Bank Account Data client
// Docs: https://developer.gocardless.com/bank-account-data/overview
import axios from 'axios';

const BASE_URL = process.env.GC_BAD_API || 'https://bankaccountdata.gocardless.com/api/v2';

export class GoCardlessBADClient {
  constructor({ secretId, secretKey, baseUrl = BASE_URL }) {
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
    this.http = axios.create({ baseURL: baseUrl, timeout: 15000 });
  }

  // Exchange secrets for access token (token-based auth flow)
  async getAccessToken() {
    // Per docs, exchange secretId/secretKey for a JWT access token
    const url = `/token/new/`; // will be resolved against baseURL
    const payload = { secret_id: this.secretId, secret_key: this.secretKey };
    const { data } = await this.http.post(url, payload);
    return data.access;
  }

  async withAuth() {
    const token = await this.getAccessToken();
    return axios.create({
      baseURL: this.baseUrl,
      timeout: 20000,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Example: list requisitions (linked bank connections)
  async listRequisitions() {
    const authed = await this.withAuth();
    const { data } = await authed.get('/requisitions/');
    return data;
  }

  async getRequisition(id) {
    const authed = await this.withAuth();
    const { data } = await authed.get(`/requisitions/${id}/`);
    return data;
  }

  async listAccountsForRequisition(id) {
    const req = await this.getRequisition(id);
    // Requisition includes accounts array of account ids
    return req.accounts || [];
  }

  // Example: fetch transactions for an account id
  async getAccountTransactions(accountId, params = {}) {
    const authed = await this.withAuth();
    // GET /accounts/{id}/transactions/
    const { data } = await authed.get(`/accounts/${accountId}/transactions/`, { params });
    return data; // expected schema includes booked and pending arrays
  }
}
