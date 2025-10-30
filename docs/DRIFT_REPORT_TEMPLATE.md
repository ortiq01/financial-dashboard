# Deployment Drift Report Template

Copy this template to document drift findings in GitHub issues.

---

## Deployment Drift Report

**Date:** [YYYY-MM-DD]  
**Environment:** [Production / Non-prod]  
**Auditor:** [Your Name]  
**Audit Command:** `npm run audit:[production|nonprod]`

### Executive Summary

[Brief 1-2 sentence summary of findings]

### Audit Results

<details>
<summary>Click to expand full audit output</summary>

```
[Paste complete output from audit script here]
```

</details>

### Issues Detected

#### Issue 1: [Title]
- **Category:** [PM2 / Config / Files / HTTP]
- **Severity:** [High / Medium / Low]
- **Expected:** [expected value or behavior]
- **Actual:** [actual value or behavior]
- **Impact:** [description of impact on service]

#### Issue 2: [Title]
- **Category:** [PM2 / Config / Files / HTTP]
- **Severity:** [High / Medium / Low]
- **Expected:** [expected value or behavior]
- **Actual:** [actual value or behavior]
- **Impact:** [description of impact on service]

### Root Cause Analysis

[Explain why the drift occurred. Examples:]
- Manual configuration change made directly on server
- Incomplete deployment that didn't update all files
- Environment variable changed without updating config
- Git repository not in sync with deployed code

### Resolution Plan

- [ ] Review and validate all detected issues
- [ ] Back up current configuration
- [ ] [Specific action item 1]
- [ ] [Specific action item 2]
- [ ] [Specific action item 3]
- [ ] Restart services as needed
- [ ] Re-run audit to verify resolution
- [ ] Update documentation if needed
- [ ] Document lessons learned

### Resolution

**Status:** [Pending / In Progress / Resolved]  
**Resolved by:** [Name]  
**Resolution date:** [YYYY-MM-DD]

**Actions taken:**
1. [List actual actions performed]
2. [Include specific commands run]
3. [Note any deviations from plan]

**Verification:**

<details>
<summary>Post-resolution audit output</summary>

```
[Paste audit output after reconciliation showing all checks pass]
```

</details>

### Lessons Learned

[Document what was learned and how to prevent similar drift in the future]

### Follow-up Actions

- [ ] Update deployment procedures
- [ ] Add monitoring/alerting for this type of drift
- [ ] Schedule regular audits
- [ ] Update documentation

---

## Quick Reference

### Common Commands

**Run audit:**
```bash
# Production
cd /opt/apps/financial-dashboard
npm run audit:production

# Non-prod
cd /opt/apps/financial-dashboard-non-prod
npm run audit:nonprod
```

**Deploy from main:**
```bash
cd /opt/apps/financial-dashboard
git fetch origin
git checkout main
git pull origin main
npm install
pm2 restart financial-dashboard-production
```

**Reset PM2 config:**
```bash
pm2 delete financial-dashboard-production
pm2 start ecosystem.production.config.cjs
pm2 save
```

### Support Resources

- [Deployment Audit Guide](DEPLOYMENT_AUDIT.md)
- [README](../README.md)
- PM2 Docs: https://pm2.keymetrics.io/docs/

---

## Example Report

Here's an example of a completed drift report:

---

## Deployment Drift Report

**Date:** 2025-10-29  
**Environment:** Production  
**Auditor:** Site Reliability Engineer  
**Audit Command:** `npm run audit:production`

### Executive Summary

Audit detected 2 issues: DEFAULT_PATH environment variable mismatch and missing sample data file. Both issues have been resolved.

### Audit Results

<details>
<summary>Click to expand full audit output</summary>

```
═══════════════════════════════════════════════════════
🔍 Deployment Drift Audit Tool
═══════════════════════════════════════════════════════
Environment: production
Expected PM2 app name: financial-dashboard-production
Expected cwd: /opt/apps/financial-dashboard
Expected port: 3002
Server URL: http://127.0.0.1:3002
═══════════════════════════════════════════════════════

📋 PM2 Process Configuration
───────────────────────────────────────────────────────
✅ [PM2] Process "financial-dashboard-production" exists
✅ [PM2] Working directory matches
   cwd: /opt/apps/financial-dashboard
✅ [PM2] Working directory exists
✅ [PM2] PORT environment variable
   PORT=3002
⚠️ [PM2] DEFAULT_PATH mismatch
   Expected: /reports/unified_dashboard.html, Actual: /portal/index.html
✅ [PM2] DISABLE_ROOT_REDIRECT matches
   DISABLE_ROOT_REDIRECT=0

[... rest of output ...]

📊 Audit Summary
═══════════════════════════════════════════════════════
Total checks: 18
✅ Passed: 15
⚠️  Warnings: 1
❌ Failed: 2
```

</details>

### Issues Detected

#### Issue 1: DEFAULT_PATH Environment Variable Mismatch
- **Category:** PM2
- **Severity:** Medium
- **Expected:** `/reports/unified_dashboard.html`
- **Actual:** `/portal/index.html`
- **Impact:** Root redirect goes to old portal instead of unified dashboard

#### Issue 2: Missing Sample Data File
- **Category:** Files
- **Severity:** Low
- **Expected:** At least one file in `public/data/`
- **Actual:** Directory is empty
- **Impact:** Users cannot test with sample data

### Root Cause Analysis

Issue 1 occurred because a manual configuration change was made to test the old portal, but the change was not reverted.

Issue 2 occurred because data files were cleaned up but sample files were not restored.

### Resolution Plan

- [x] Review and validate all detected issues
- [x] Back up current PM2 configuration
- [x] Update DEFAULT_PATH to correct value
- [x] Copy sample data file to public/data/
- [x] Restart PM2 process
- [x] Re-run audit to verify resolution
- [x] Update documentation to prevent future drift

### Resolution

**Status:** Resolved  
**Resolved by:** Site Reliability Engineer  
**Resolution date:** 2025-10-29

**Actions taken:**
1. Updated PM2 environment variable:
   ```bash
   pm2 delete financial-dashboard-production
   pm2 start ecosystem.production.config.cjs
   pm2 save
   ```
2. Copied sample data file:
   ```bash
   cp backup/sample-data.tab public/data/
   ```
3. Restarted service and verified functionality:
   ```bash
   pm2 restart financial-dashboard-production
   curl http://127.0.0.1:3002/health
   ```

**Verification:**

<details>
<summary>Post-resolution audit output</summary>

```
📊 Audit Summary
═══════════════════════════════════════════════════════
Total checks: 18
✅ Passed: 18
⚠️  Warnings: 0
❌ Failed: 0
```

</details>

### Lessons Learned

1. Always use ecosystem config files to restart PM2 processes instead of manual env var changes
2. Maintain a backup of sample data files in a separate location
3. Document all manual changes immediately to prevent drift

### Follow-up Actions

- [x] Update deployment procedures to emphasize using ecosystem configs
- [ ] Add weekly automated audit to cron
- [ ] Create sample-data backup location
- [x] Update documentation with this lesson learned

---
