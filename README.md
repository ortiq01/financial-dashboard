# Financial Dashboard

A Node.js/Express app serving a unified, explainable financial dashboard. It supports manual uploads of bank exports (CSV/TAB/TXT), CBS-style categorization with explainability, exports, and an optional GoCardless BAD sync.

## Features

- Unified dashboard at `/reports/unified_dashboard.html` with:
	- KPIs, category breakdowns, per-account view, monthly summary (with Δ vs previous month)
	- Explainable CBS categorization + manual overrides (per-transaction and keyword rules)
	- Transfer exclusion toggle, deep-linkable filters, mobile optimizations
	- CSV exports (transactions, categories)
- Manual upload: Click “📥 Upload” or drag/drop a bank export (CSV/TAB/TXT). URL load also supported.
- Deduplication & validation: Prevents duplicate rows across merged sources; warns if Amount column missing.
- Optional GoCardless BAD sync: Bi-weekly scheduler, manual trigger, merge with uploaded data.

Other:
- Root redirect to the unified dashboard can be disabled with `DISABLE_ROOT_REDIRECT=1` or via `/?noredirect`.
- Health endpoint: `/health`.

## Getting Started

## Run

```bash
npm install
npm start
```


The `PORT` environment variable is supported (defaults to 3002).

## Development

This project is set up for web development. You can add new HTML, CSS, or JavaScript files to the `public/` directory, or extend the Express server for new API endpoints.

### Useful Commands

- `npm install` – Install dependencies
- `npm start` – Start the server
- `npm run dev` – Start in development mode
- `npm run audit:production` – Audit production deployment for drift
- `npm run audit:nonprod` – Audit non-prod deployment for drift

## Agent Instructions (for AI/Automation)

This repository is a web development environment. The agent should:

- Support the development of web applications (HTML, CSS, JS, Node.js, Express)
- Help with adding, editing, or debugging static and dynamic web content
- Assist in creating new endpoints, serving assets, and improving the dashboard UI/UX
- Provide best practices for web development and code organization

### Environment Details

- **Platform:** Proxmox-based, with LXC containers and VMs for modular web, dashboard, and proxy services
- **Reverse Proxy:** Nginx Proxy Manager (CT 100, 192.168.1.10), public entrypoint, SSL, Cloudflare
- **Production App:** CT 125 (192.168.1.25), Node.js/Express, PM2, reports in `/opt/apps/financial-dashboard/public/reports`
- **Development App:** CT 126 (192.168.1.26), Node.js/Express, PM2
- **Legacy Webserver:** CT 116 (192.168.1.20)
- **Network:** All public traffic flows through Cloudflare and Nginx Proxy Manager; internal LAN is 192.168.1.x
- **Management:** Use `pct enter <CTID>` from Proxmox host to access containers; use `pm2` for Node.js process management
- **Health Check:** `curl http://127.0.0.1:3002/health` inside app containers
- **Public URL:** https://tracker.hernandezortiz.pro/ (proxied to CT 125)
- **Nginx Proxy Manager UI:** https://<proxy-ip>:81

For troubleshooting, always consider the network topology, reverse proxy rules, and PM2 process status. See `ENVIRONMENT_OVERVIEW.md` for full details.

## Deployment & Operations

### Deployment Drift Audit

To verify that the deployed server matches the repository configuration, use the deployment audit tool:

```bash
# On the production server (CT 125)
cd /opt/apps/financial-dashboard
npm run audit:production

# On the non-prod server (CT 126)
cd /opt/apps/financial-dashboard-non-prod
npm run audit:nonprod
```

The audit tool checks:
- PM2 process configuration and environment variables
- Expected file existence (reports, data, portal files)
- Health and status endpoints
- Root redirect behavior

For detailed instructions on running audits and reconciling drift, see [docs/DEPLOYMENT_AUDIT.md](docs/DEPLOYMENT_AUDIT.md).

----

## GoCardless Bank Account Data integration (optional)

This app can pull transactions from GoCardless BAD and write a merged dataset to `public/data/synced_transactions.json`.

Setup:
1. Copy `.env.example` to `.env` and set:
	- `GC_BAD_SECRET_ID` and `GC_BAD_SECRET_KEY`
	- `GC_BAD_ACCOUNT_IDS` (comma-separated account IDs to sync)
	- `ENABLE_SYNC_CRON=1` to enable bi-weekly schedule (1st & 15th at 03:00)
 	- Optional: `GC_BAD_API=https://bankaccountdata.gocardless.com/api/v2` (correct host)
2. Start the server and trigger a manual sync:
	- POST `/api/sync/run` with JSON body `{ "accountIds": ["acc-id-1"] }` or rely on env `GC_BAD_ACCOUNT_IDS`.
3. Check status at `/api/sync/status`.

Credentials are loaded from `.env` via `dotenv`. Do not commit secrets.

### Manual Upload Workflow

1. Open `/reports/unified_dashboard.html`.
2. Use “📥 Upload” (or drag/drop) to load `.CSV`, `.TAB`, or `.TXT`.
3. Optionally paste a server path/URL and click “Load URL”.
4. Use filters, edit rules, and export CSVs.

### Deduplication Details

- Each row is keyed as `(date | amount | canonical description | account)`.
- If an ID-like column exists (Transaction ID, End-to-End ID, Kenmerk), that is preferred, combined with account.
- Aggressive mode removes IBAN-like and long reference tokens in the key to collapse trivial variations.
- When duplicates are removed, the status pill shows `OK • dedupe: N`.
