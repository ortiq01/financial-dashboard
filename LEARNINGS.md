# Project Learnings (Financial Dashboard)

This document captures key decisions, rules, and implementation notes to help future work.

## What we built
- Unified dashboard (vanilla JS/HTML/CSS) served by Node.js/Express + PM2.
- Canonical unified page, legacy pages redirected.
- Robust CSV/TAB ingestion with delimiter/header inference and EU number normalization.
- CBS-inspired categorization engine with explainability (source + detail) and local overrides.
- Transfers handling ("Overboekingen & Transfers") + toggle to exclude in summaries.
- Monthly summaries, per-account view, category table, transaction list, CSV exports.
- SEPA-aware matching: rules evaluate combined SEPA remittance + description haystack.
- Granular income handling: default positives → Inkomen, with subcategories (Salaris, Toeslag, Pensioen, Rente & Dividend, Belasting Teruggave, Huishoudbijdrage, Huurinkomsten).

## Recent UI decisions
- Categories card shows a single Totaal (Netto) value; Aantal counts income txns for "Inkomen", expense txns elsewhere.
- Monthly summary uses separate columns for Uitgaven and Netto.
- Mobile UX: sticky headers; hide low-priority columns on very small screens; relaxed card min-widths.

## Rule and vendor learnings
- Transfers detection expanded (loan/voorgeschoten/kidsrekening/vakantiepot) to reduce noise.
- Utilities/insurance/bank fees expanded (e.g., Tibber, VinkVink, Assuradeuren/Veldhuis, ABN AMRO/basispakket).
- Direction-aware rules to avoid misclassifying refunds/expenses as income.

## Technical notes
- Deep link query params for month/account filters; preferences (exclude transfers) persisted via localStorage.
- Explainability: transactions table includes "Uitleg" column showing categorization source/rationale.
- Exports: transactions and categories CSV with optional Month column.

## Open follow-ups
- Author a small rules-management UI (add/edit/delete, priority order) and import/export rules as JSON.
- Add minimal tests for parsing/categorization and a smoke E2E with a sample TAB file.
- Consider a Web Worker for parsing to keep UI responsive on large files.

## Integration lessons (GoCardless BAD)
- The correct base host is `https://bankaccountdata.gocardless.com/api/v2` (not the Dashboard host).
- After fixing DNS/host, 401 errors with detail "No active account found with the given credentials" indicate the provided secretId/secretKey pair is not active for BAD; app-side retries won’t fix this.
- Keep helper endpoints (`/api/gc/requisitions`, `/api/gc/requisitions/:id`) for diagnostics; they’re gated by env secrets.

## Manual upload and dedupe
- Support `.CSV`, `.TAB`, and `.TXT` imports via button and drag/drop. URL loading supported for remote/static paths.
- Validation: check presence of an Amount column; display a friendly warning if missing.
- Dedupe strategy:
	- Prefer stable transaction identifiers when available (Transaction ID, End-to-End ID, Kenmerk) combined with account.
	- Fallback key = `date | amount | canonical(description) | account`.
	- Aggressive mode strips IBAN-like and long reference tokens to collapse near-duplicates.
- UX: show a status pill with dedupe count ("OK • dedupe: N").
