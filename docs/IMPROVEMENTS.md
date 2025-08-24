# Improvements Backlog

This document tracks actionable improvements grouped by area.

## Product/UI
- Rules manager UI (add/edit/delete, ordering, import/export JSON).
- Parsing UX: move to a Web Worker; add progress/errors banner.
- Non-prod badge and `<meta name="robots" content="noindex">`.

## Data/Categorization
- Extend CBS rules (more Dutch vendors; refunds/chargebacks edge cases).
- Strengthen date parsing (timezone/locale); optional multi-currency.

## Upload & Dedupe
- Unit tests for parsing/dedupe (ID-first and fallback keys).
- Persist dedupe settings; show brief “duplicates removed” report.

## GoCardless BAD (optional)
- Decide: remove/feature-flag/park (current 401 on creds).
- If proceeding: consent/requisition flow UI; account selection.

## Ops/Environments
- Expose non-prod via reverse proxy to :3102; protect with basic auth/IP allowlist.
- PM2 log rotation; remove legacy ecosystem files when ready.
- Backup `public/data/synced_transactions.json` (cron + retention).

## Security/Compliance
- Ensure .env handled securely; restrict perms; avoid commits.
- Non-prod: ensure schedulers disabled and no outbound BAD sync.

## Tests/CI
- Minimal unit tests for parsing/categorization.
- One smoke E2E with a sample TAB/CSV.
- Optional CI (lint/test) on PR.

## Docs
- Expand README with prod/non-prod run, PM2 app names, workspace files, and noindex/basic-auth guidance.
- OPERATIONS.md for backups, logs, restart procedures.
