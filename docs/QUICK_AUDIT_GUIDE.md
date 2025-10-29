# Quick Audit Guide

This is a condensed reference for running deployment audits on the server.

## Quick Start

### On Production Server (CT 125)

```bash
pct enter 125
cd /opt/apps/financial-dashboard
npm run audit:production
```

### On Non-prod Server (CT 126)

```bash
pct enter 126
cd /opt/apps/financial-dashboard-non-prod
npm run audit:nonprod
```

## What Gets Checked

✅ PM2 process running with correct name and config  
✅ Working directory exists and matches config  
✅ Environment variables (PORT, DEFAULT_PATH, DISABLE_ROOT_REDIRECT)  
✅ Expected files and directories exist  
✅ `/health` endpoint returns OK  
✅ `/status` endpoint accessible  
✅ Root redirect behavior works as expected  
✅ Unified dashboard is accessible  

## Expected Configuration

### Production
- **PM2 Name:** `financial-dashboard-production`
- **Directory:** `/opt/apps/financial-dashboard`
- **Port:** `3002`
- **URL:** http://127.0.0.1:3002
- **Default Path:** `/reports/unified_dashboard.html`
- **Root Redirect:** Enabled (0)

### Non-prod
- **PM2 Name:** `financial-dashboard-nonprod`
- **Directory:** `/opt/apps/financial-dashboard-non-prod`
- **Port:** `3102`
- **URL:** http://127.0.0.1:3102
- **Default Path:** `/reports/unified_dashboard.html`
- **Root Redirect:** Enabled (0)

## Quick Fixes

### Fix PM2 Config Mismatch

```bash
cd /opt/apps/financial-dashboard  # or financial-dashboard-non-prod
pm2 delete financial-dashboard-production  # or financial-dashboard-nonprod
pm2 start ecosystem.production.config.cjs  # or ecosystem.nonprod.config.cjs
pm2 save
```

### Update Code from Main

```bash
cd /opt/apps/financial-dashboard  # or financial-dashboard-non-prod
git fetch origin
git checkout main
git pull origin main
npm install
pm2 restart financial-dashboard-production  # or financial-dashboard-nonprod
```

### Check Logs

```bash
pm2 logs financial-dashboard-production  # or financial-dashboard-nonprod
pm2 logs financial-dashboard-production --err --lines 100
```

### Test Endpoints Manually

```bash
# Health check
curl http://127.0.0.1:3002/health  # or 3102 for nonprod

# Status check
curl http://127.0.0.1:3002/status  # or 3102 for nonprod

# Test root redirect
curl -I http://127.0.0.1:3002/  # or 3102 for nonprod

# Test unified dashboard
curl -I http://127.0.0.1:3002/reports/unified_dashboard.html
```

## Interpreting Results

### ✅ Pass
Everything is correct. No action needed.

### ⚠️ Warning
Something is different but might be expected (e.g., PM2 not available when running outside server).
Review the warning and verify if it's expected.

### ❌ Fail
Something is wrong and needs to be fixed.
Follow the recommended actions in the audit output.

## Common Issues

### "PM2 not found"
- **Cause:** Running audit outside the server
- **Action:** SSH into the server or use `--skip-http` flag

### "Working directory does not exist"
- **Cause:** Code not deployed or wrong path
- **Action:** Clone repository to expected path or fix PM2 config

### "Port mismatch"
- **Cause:** PM2 config doesn't match ecosystem file
- **Action:** Restart PM2 with ecosystem config file

### "Health endpoint fails"
- **Cause:** Service not running or crashed
- **Action:** Check `pm2 status` and `pm2 logs`, restart if needed

### "DEFAULT_PATH mismatch"
- **Cause:** Manual env var change or outdated config
- **Action:** Update PM2 config to match ecosystem file

## Manual Checklist

When audit tool is not available, manually verify:

### PM2 Process
```bash
pm2 status
pm2 show financial-dashboard-production  # Check env vars
```

### Files
```bash
ls -la /opt/apps/financial-dashboard/public/reports/unified_dashboard.html
ls -la /opt/apps/financial-dashboard/public/index.html
ls -la /opt/apps/financial-dashboard/public/data/
```

### Endpoints
```bash
curl http://127.0.0.1:3002/health
curl http://127.0.0.1:3002/status
curl -I http://127.0.0.1:3002/
```

### Reverse Proxy (Nginx Proxy Manager)
1. Open https://192.168.1.10:81
2. Check proxy hosts
3. Verify production points to 192.168.1.25:3002
4. Verify SSL certificate is active

## Need Help?

- Full documentation: `docs/DEPLOYMENT_AUDIT.md`
- Report template: `docs/DRIFT_REPORT_TEMPLATE.md`
- Application README: `README.md`

## Monthly Audit Checklist

Run this checklist on the 1st of each month:

- [ ] SSH into production server (CT 125)
- [ ] Run `npm run audit:production`
- [ ] Review results and fix any issues
- [ ] SSH into non-prod server (CT 126)
- [ ] Run `npm run audit:nonprod`
- [ ] Review results and fix any issues
- [ ] Document findings in GitHub issue
- [ ] Update deployment documentation if needed
- [ ] Check Nginx Proxy Manager configuration
- [ ] Verify SSL certificates are valid
- [ ] Test public URL: https://tracker.hernandezortiz.pro/

## Deployment Version Check

To verify what version is deployed:

```bash
cd /opt/apps/financial-dashboard
git log -1 --oneline
git status
git diff origin/main  # Check if there are uncommitted changes
```

Record the commit SHA for reference:
```bash
echo "Deployed version: $(git rev-parse HEAD)" >> /tmp/deployment-log.txt
echo "Deployment date: $(date)" >> /tmp/deployment-log.txt
```
