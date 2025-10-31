# Issues to create (alignment plan)

This document lists the issues to create in GitHub to align the repo with the intended UX and production behavior.

---

## 1) Add portal overview for multi‑account access (account cards + deep links)

Problem: No top‑level overview to pick an account and jump in with presets.

Proposal:
- Create `public/portal/index.html` with responsive account cards.
- Add `public/config/accounts.json` to define accounts (id/label/currency/default dataset path).
- Each card links to `/reports/unified_dashboard.html?accounts=<ID>` (+ optional `data=<path>`).
- Add `/portal` static route in `server.js`; optionally set `DEFAULT_PATH=/portal` in non‑prod.

AC:
- `/portal` lists accounts; clicking preselects the account in the dashboard.
- JSON config drives cards; mobile friendly.
- README documents usage.

---

## 2) Dashboard toolbar: add persistent "← Financial Dashboard Portal" link

Problem: No easy navigation back to the overview.

Proposal: Add a toolbar link to `/portal` (hide if portal not present).

AC: Link visible when `/portal` exists; works on mobile.

---

## 3) Month selector should recompute locally instead of refetching

Problem: Changing month triggers a network re‑fetch (can 404) and resets state.

Proposal:
- Update `#monthSelect` change handler to only update the `month` query param and call `recomputeAndRender()`.
- Month table row click should also update URL + recompute.

AC: No network fetch on month change; deep‑link preserved.

---

## 4) Prevent double dataset load overriding user selection on init

Problem: Race between default load and user‑specified load can override intent.

Proposal:
- Track last loaded URL (e.g., `window.__LAST_LOADED_DATA_URL__`).
- Skip duplicate loads and guard re‑entrancy at init.

AC: `?data=...` never gets overridden by defaults.

---

## 5) Parser robustness: quoted CSV/semicolon/tab, BOM, Rabobank Af/Bij → Bedrag

Problem: Simple split breaks with quotes; Rabobank exports rely on Af/Bij.

Proposal:
- Implement `splitQuoted()` for ',', ';', and '\t'.
- Strip UTF‑8 BOM.
- Synthesize signed `Bedrag` when Af/Bij + absolute amount present.
- Keep/improve header inference.

AC: Quoted CSV/TAB parse correctly; Rabobank files classify correctly.

---

## 6) Freshness indicator: HEAD Last‑Modified + status pill

Problem: Last updated shows render time, not data freshness.

Proposal:
- `HEAD` the dataset URL; read `Last‑Modified` (when same‑origin).
- Show freshness pill with timestamp; graceful fallback for cross‑origin.

AC: Accurate freshness for local files; fallback for others.

---

## 7) PM2 configs: verify/align cwd paths and add non‑prod/prod variants

Problem: Mixed cwd paths across environments cause startup issues.

Proposal: Ensure both exist and are documented:
- `ecosystem.production.config.cjs` (cwd: `/opt/apps/financial-dashboard`)
- `ecosystem.nonprod.config.cjs` (cwd: `/opt/apps/financial-dashboard-non-prod`)

AC: PM2 boots clean in prod and non‑prod; README clarifies usage.

---

## 8) Audit and align server deployment vs repo (drift check)

Problem: Need to validate differences between server and repo and reconcile.

Proposal: Checklist doc/steps:
- Verify expected files exist on server, PM2 cwd matches config, and `DEFAULT_PATH` behavior is correct.
- Confirm reverse proxy to the right container/port; verify `/health` and `/status`.
- Update server to match `main` or push a PR.

AC: Drift report documented and deployment aligned or plan captured.

---

## 9) (Optional) Quick search and classification source chips

Proposal: Add a lightweight `Ctrl/Cmd+K` quick search filter and source chips in transaction rows (e.g., Rule/MCC/Keyword/Amount) to improve explainability.

AC: Global search toggles a filter; rows show a small source label.
