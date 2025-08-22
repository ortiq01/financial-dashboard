# Financial Dashboard


Financial Dashboard is a minimal Node.js Express web application that serves static financial reports and provides a /health endpoint for monitoring. The app is designed for web development and can be extended to support more advanced dashboard features.

## Features


 DEFAULT_PATH now defaults to '/reports/dynamic_financial_dashboard.html'
 Root redirect can be disabled with DISABLE_ROOT_REDIRECT=1 or by visiting `/?noredirect`. When disabled, `/` serves a simple index with links to all reports.

- `server.js` – Main Express server
- `public/` – Static assets (HTML, CSS, JS, reports)
- `package.json` – Project metadata and dependencies

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

----
