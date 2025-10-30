# Deployment Drift Audit Guide

This guide explains how to use the deployment audit tool to verify that the deployed server matches the repository configuration and how to reconcile any differences.

## Overview

The deployment audit tool (`scripts/audit-deployment.js`) performs automated checks to verify:

1. **PM2 Configuration**: Process name, working directory, and environment variables
2. **File System**: Existence of critical files and directories
3. **HTTP Endpoints**: Health checks, status endpoints, and redirect behavior
4. **Environment Settings**: DEFAULT_PATH, root redirect configuration

## Running the Audit

### On the Server

SSH into the appropriate container and run the audit:

```bash
# For production (CT 125)
pct enter 125
cd /opt/apps/financial-dashboard
npm run audit:production

# For non-prod (CT 126)
pct enter 126
cd /opt/apps/financial-dashboard-non-prod
npm run audit:nonprod
```

### From Repository

You can also run checks from the repository:

```bash
# Check repository configuration only (skip HTTP checks)
npm run audit:production -- --skip-http
npm run audit:nonprod -- --skip-http

# Check against a specific server URL
npm run audit:production -- --server-url=https://tracker.hernandezortiz.pro
```

### Command Line Options

- `--environment=production|nonprod` - Select environment configuration (default: production)
- `--server-url=URL` - Override the server URL for HTTP checks
- `--skip-http` - Skip HTTP endpoint checks (useful when running outside the server)

## Audit Checklist

The tool automatically checks the following items:

### 1. PM2 Process Configuration

- ✅ PM2 process exists with correct name
- ✅ Working directory (`cwd`) matches ecosystem config
- ✅ Working directory exists on filesystem
- ✅ `PORT` environment variable is set correctly
- ✅ `DEFAULT_PATH` environment variable matches config
- ✅ `DISABLE_ROOT_REDIRECT` setting is correct

**Expected Values:**

**Production:**
- Name: `financial-dashboard-production`
- CWD: `/opt/apps/financial-dashboard`
- Port: `3002`
- DEFAULT_PATH: `/reports/unified_dashboard.html`
- DISABLE_ROOT_REDIRECT: `0` (redirect enabled)

**Non-prod:**
- Name: `financial-dashboard-nonprod`
- CWD: `/opt/apps/financial-dashboard-non-prod`
- Port: `3102`
- DEFAULT_PATH: `/reports/unified_dashboard.html`
- DISABLE_ROOT_REDIRECT: `0` (redirect enabled)

### 2. Repository Configuration Files

- ✅ Ecosystem config file exists (`ecosystem.production.config.cjs` or `ecosystem.nonprod.config.cjs`)
- ✅ Config contains correct `cwd` path
- ✅ Config contains correct `PORT` setting

### 3. Expected Files

**Required files:**
- ✅ `public/reports/unified_dashboard.html` - Main dashboard
- ✅ `public/index.html` - Landing page
- ✅ `server.js` - Application server
- ✅ `package.json` - Node.js dependencies

**Required directories:**
- ✅ `public/data/` - Data storage directory
- ✅ `public/reports/` - Reports directory

**Sample data:**
- ⚠️ At least one sample file in `public/data/` (warning if empty)

### 4. HTTP Endpoints

- ✅ `/health` - Returns `{"status": "ok", "service": "financial-dashboard", "ts": "..."}`
- ✅ `/status` - Returns plain text "financial-dashboard: ok"
- ✅ `/` (root) - Redirects to DEFAULT_PATH (unless DISABLE_ROOT_REDIRECT=1)
- ✅ `/reports/unified_dashboard.html` - Main dashboard is accessible

### 5. Reverse Proxy (Manual Check)

The audit tool cannot automatically verify reverse proxy configuration. Manually verify:

**Production:**
- External URL: `https://tracker.hernandezortiz.pro/`
- Should proxy to internal production server on port 3002 (see README.md for IP)
- SSL: Enabled via Cloudflare

**Non-prod:**
- Should be accessible internally on port 3102 (see README.md for IP)
- May be protected with basic auth or IP allowlist
- Should NOT be publicly accessible

**Check in Nginx Proxy Manager (web UI - see README.md for access details):**
1. Verify proxy host configuration
2. Confirm SSL certificate is active
3. Check access list if applicable
4. Verify custom locations if any

## Reconciliation Procedures

When the audit detects drift, follow these steps to reconcile:

### Scenario 1: PM2 Configuration Mismatch

**Problem:** PM2 environment variables don't match repository config

**Solution:**
```bash
# On the server
cd /opt/apps/financial-dashboard  # or financial-dashboard-non-prod

# Pull latest config
git fetch origin
git checkout main
git pull origin main

# Update PM2 config
pm2 delete financial-dashboard-production  # or financial-dashboard-nonprod
pm2 start ecosystem.production.config.cjs  # or ecosystem.nonprod.config.cjs
pm2 save

# Verify
pm2 show financial-dashboard-production  # Check env vars
pm2 logs financial-dashboard-production --lines 50
```

### Scenario 2: Missing or Outdated Files

**Problem:** Files in deployment don't match repository

**Solution:**
```bash
# On the server
cd /opt/apps/financial-dashboard  # or financial-dashboard-non-prod

# Stash local changes if any
git stash

# Pull latest from main
git fetch origin
git checkout main
git pull origin main

# Reinstall dependencies
npm install

# Restart application
pm2 restart financial-dashboard-production  # or financial-dashboard-nonprod

# Verify files
ls -la public/reports/
ls -la public/data/
```

### Scenario 3: Environment Variable Mismatch

**Problem:** DEFAULT_PATH or other env vars are incorrect

**Options:**

**Option A: Update PM2 config in repository**
```bash
# On your local machine or in repository
# Edit ecosystem.production.config.cjs or ecosystem.nonprod.config.cjs
# Commit and push changes
git add ecosystem.*.config.cjs
git commit -m "fix: update PM2 environment configuration"
git push origin main

# Then on server, follow Scenario 1 solution
```

**Option B: Use .env file**
```bash
# On the server
cd /opt/apps/financial-dashboard  # or financial-dashboard-non-prod

# Create or edit .env file
cat > .env << EOF
PORT=3002
DEFAULT_PATH=/reports/unified_dashboard.html
DISABLE_ROOT_REDIRECT=0
NODE_ENV=production
EOF

# Restart to pick up .env changes
pm2 restart financial-dashboard-production
```

### Scenario 4: Health Endpoint Failures

**Problem:** `/health` or `/status` endpoints return errors

**Diagnosis:**
```bash
# Check if process is running
pm2 status

# Check logs for errors
pm2 logs financial-dashboard-production --lines 100

# Test locally on the server
curl http://127.0.0.1:3002/health
curl http://127.0.0.1:3002/status

# Check port binding
netstat -tlnp | grep 3002  # or 3102 for nonprod
```

**Solution:**
```bash
# If process is not running or crashed
pm2 restart financial-dashboard-production

# If port is already in use
pm2 delete financial-dashboard-production
pm2 start ecosystem.production.config.cjs

# If still failing, check application logs
pm2 logs financial-dashboard-production --err --lines 200
```

### Scenario 5: Complete Redeployment

**Problem:** Multiple issues or major drift detected

**Solution (Full redeployment):**
```bash
# On the server
cd /opt/apps

# Backup current installation
sudo mv financial-dashboard financial-dashboard.backup.$(date +%Y%m%d_%H%M%S)

# Fresh clone
sudo git clone https://github.com/ortiq01/financial-dashboard.git
cd financial-dashboard

# Install dependencies
npm install

# Configure environment if needed
cp .env.example .env
# Edit .env with appropriate values

# Start with PM2
pm2 start ecosystem.production.config.cjs
pm2 save

# Verify
npm run audit:production
curl http://127.0.0.1:3002/health

# If successful, remove backup
# sudo rm -rf /opt/apps/financial-dashboard.backup.*
```

## Documenting Drift

When you discover drift, document it in the GitHub issue:

### Drift Report Template

```markdown
## Deployment Drift Report

**Date:** [YYYY-MM-DD]
**Environment:** [Production/Non-prod]
**Auditor:** [Your Name]

### Audit Results

[Paste output of audit script]

### Issues Detected

1. **[Category]** - [Description]
   - Expected: [value]
   - Actual: [value]
   - Impact: [High/Medium/Low]

2. ...

### Root Cause Analysis

[Explain why the drift occurred]

### Resolution Plan

- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] Verify with audit script
- [ ] Update documentation if needed

### Resolution

**Status:** [Pending/In Progress/Resolved]
**Resolved by:** [Name]
**Resolution date:** [YYYY-MM-DD]
**Actions taken:**
- [List actual actions performed]

**Verification:**
```
[Paste audit output after reconciliation]
```
```

## Preventive Measures

To prevent future drift:

1. **Use Git for Deployment**
   - Always deploy from a specific branch or tag
   - Document the commit SHA of the deployed version
   - Use `git log -1` to record deployment version

2. **PM2 Ecosystem Files**
   - Keep ecosystem configs in version control
   - Use ecosystem files to start PM2 processes (not manual commands)
   - Commit any config changes before deploying

3. **Environment Variables**
   - Prefer `.env` files over manual PM2 env settings for secrets
   - Document required environment variables in `.env.example`
   - Use PM2 ecosystem files for non-secret env vars

4. **Regular Audits**
   - Run audit script monthly or after any configuration change
   - Include audit in deployment checklist
   - Consider adding to monitoring/alerting

5. **Change Documentation**
   - Document all manual changes made on servers
   - Create GitHub issues for configuration drift
   - Keep a deployment log

## Troubleshooting

### "PM2 not found"

This is expected when running outside the server. Use `--skip-http` flag.

### "Unable to query PM2 processes"

You need to run the audit on the server where PM2 is running, or ensure PM2 is installed globally.

### "Connection refused" for HTTP checks

Ensure:
1. The server is running (`pm2 status`)
2. The correct port is specified
3. You're running the audit on the server (or have network access)
4. Firewall rules allow the connection

### "Directory not accessible"

When running outside the server, deployment directory checks will be skipped. This is expected.

## Related Documentation

- [README.md](../README.md) - Application overview and getting started
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Planned improvements and backlog
- Production PM2 config: `ecosystem.production.config.cjs`
- Non-prod PM2 config: `ecosystem.nonprod.config.cjs`

## Support

For issues or questions:
1. Check the audit output for specific recommendations
2. Review PM2 logs: `pm2 logs [app-name]`
3. Check application logs in deployment directory
4. Verify reverse proxy configuration in Nginx Proxy Manager
5. Open a GitHub issue if drift cannot be resolved
