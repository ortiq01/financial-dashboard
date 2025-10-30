# Deployment Drift Audit Tool - Summary

This document provides a high-level overview of the deployment drift audit tool implementation.

## Overview

The deployment drift audit tool helps maintain alignment between the GitHub repository and deployed server instances by automatically checking configuration, files, and runtime behavior.

## Purpose

Address the need to:
- Validate differences between GitHub repo and deployed servers
- Ensure production and non-production environments match expected configurations
- Provide actionable remediation steps when drift is detected
- Document drift findings systematically

## Components

### 1. Audit Script (`scripts/audit-deployment.js`)

A Node.js script that performs comprehensive checks:

**Checks Performed:**
- ✅ PM2 process configuration (name, cwd, env vars)
- ✅ File system integrity (expected files and directories)
- ✅ HTTP endpoints functionality (/health, /status, dashboard)
- ✅ Root redirect behavior
- ✅ Configuration file validation

**Features:**
- Environment-aware (production vs non-prod)
- Flexible (skip HTTP checks, custom server URLs)
- Clear output (pass/warn/fail with details)
- Exit codes for CI/CD integration
- Actionable recommendations

### 2. NPM Scripts

Easy-to-use commands added to `package.json`:

```bash
npm run audit:deployment      # Generic audit with defaults
npm run audit:production      # Production environment
npm run audit:nonprod         # Non-prod environment
```

### 3. Documentation

**DEPLOYMENT_AUDIT.md** (Comprehensive Guide)
- Complete audit checklist
- Expected configuration values
- Step-by-step reconciliation procedures
- Troubleshooting guide
- Preventive measures

**QUICK_AUDIT_GUIDE.md** (Quick Reference)
- Condensed checklist for server operations
- Common commands and fixes
- Manual verification steps
- Monthly audit checklist

**DRIFT_REPORT_TEMPLATE.md** (Documentation Template)
- Standardized format for reporting drift
- Issue tracking structure
- Example completed report
- Root cause analysis framework

**README.md Updates**
- Quick reference to audit commands
- Link to detailed documentation
- Integration with existing ops documentation

## Usage

### Basic Usage

```bash
# On production server
cd /opt/apps/financial-dashboard
npm run audit:production

# On non-prod server
cd /opt/apps/financial-dashboard-non-prod
npm run audit:nonprod
```

### Advanced Usage

```bash
# Skip HTTP checks (for local/CI use)
npm run audit:production -- --skip-http

# Use custom server URL
npm run audit:production -- --server-url=https://example.com

# Check different environment
node scripts/audit-deployment.js --environment=nonprod
```

## Expected Configurations

### Production
- **App Name:** financial-dashboard-production
- **Directory:** /opt/apps/financial-dashboard
- **Port:** 3002
- **Default Path:** /reports/unified_dashboard.html
- **Root Redirect:** Enabled

### Non-prod
- **App Name:** financial-dashboard-nonprod
- **Directory:** /opt/apps/financial-dashboard-non-prod
- **Port:** 3102
- **Default Path:** /reports/unified_dashboard.html
- **Root Redirect:** Enabled

## Workflow

1. **Run Audit**: Execute audit script on server
2. **Review Results**: Check pass/warn/fail status
3. **Document Findings**: Use drift report template if issues found
4. **Reconcile**: Follow remediation procedures
5. **Verify**: Re-run audit to confirm resolution
6. **Update**: Improve documentation/procedures as needed

## Integration Points

- **PM2 Ecosystem Files**: Validates against ecosystem.*.config.cjs
- **Environment Variables**: Checks PORT, DEFAULT_PATH, DISABLE_ROOT_REDIRECT
- **File Structure**: Ensures public/reports/, public/data/ exist
- **HTTP Endpoints**: Tests /health, /status, root redirect
- **README**: References for IP addresses and network topology

## Reconciliation Strategies

**Common Scenarios:**
1. PM2 config mismatch → Restart with ecosystem file
2. Missing files → Pull from main branch
3. Environment variable drift → Update .env or PM2 config
4. Health endpoint failure → Check logs, restart service
5. Complete drift → Full redeployment from main

## Maintenance

### Regular Tasks
- Run monthly audits (1st of month)
- Document all manual server changes
- Keep ecosystem configs in sync
- Update documentation when config changes

### Best Practices
- Always deploy from git (never manual file edits)
- Use ecosystem files for PM2 processes
- Prefer .env for secrets, ecosystem for non-secrets
- Record deployment commit SHAs
- Test audit tool after deployment

## Benefits

✅ **Automated Validation**: No manual checklist needed  
✅ **Consistent Checks**: Same validation every time  
✅ **Clear Output**: Easy to understand results  
✅ **Actionable**: Provides specific remediation steps  
✅ **Documentation**: Standardized drift reporting  
✅ **Preventive**: Catches issues before they impact users  
✅ **CI/CD Ready**: Exit codes and --skip-http flag  

## Files Added/Modified

```
scripts/
  audit-deployment.js          # Main audit script

docs/
  DEPLOYMENT_AUDIT.md          # Comprehensive guide
  QUICK_AUDIT_GUIDE.md         # Quick reference
  DRIFT_REPORT_TEMPLATE.md     # Reporting template
  AUDIT_TOOL_SUMMARY.md        # This file

package.json                   # Added audit scripts
README.md                      # Added audit section
```

## Testing

All components tested:
- ✅ Audit script runs successfully
- ✅ Both production and nonprod configs work
- ✅ --skip-http flag works correctly
- ✅ --server-url override works
- ✅ HTTP checks validate endpoints
- ✅ Error handling for invalid input
- ✅ Exit codes work correctly
- ✅ Server still runs after changes
- ✅ No security vulnerabilities (CodeQL verified)

## Security Considerations

- Internal IP addresses referenced via README (not hardcoded in multiple places)
- No secrets in code or documentation
- Tool runs with user permissions (no sudo required)
- HTTP checks use localhost by default
- Documentation accessible only to repo collaborators

## Future Enhancements

Potential improvements:
- JSON output format for automation
- Integration with monitoring/alerting
- Scheduled cron job for automatic audits
- Slack/email notifications on drift detection
- Comparison with previous audit results
- Git history integration (show last deployment commit)

## Support

- **Main Documentation**: docs/DEPLOYMENT_AUDIT.md
- **Quick Reference**: docs/QUICK_AUDIT_GUIDE.md
- **Reporting**: docs/DRIFT_REPORT_TEMPLATE.md
- **Issues**: Use GitHub issue tracker

## Success Criteria Met

✅ Automated checklist for server verification  
✅ PM2 cwd and config validation  
✅ DEFAULT_PATH and redirect checks  
✅ Reverse proxy verification (manual checklist)  
✅ Health and status endpoint validation  
✅ Expected files verification  
✅ Drift reporting documentation  
✅ Reconciliation procedures documented  
✅ Ready for deployment or PR merge  

## Acceptance Criteria Achieved

From original issue requirements:

1. ✅ **Automated Checklist**: Script checks all required items
2. ✅ **PM2 Validation**: Confirms cwd matches config and directory exists
3. ✅ **DEFAULT_PATH**: Verifies portal vs unified setting
4. ✅ **Root Redirect**: Checks redirect behavior
5. ✅ **Reverse Proxy**: Manual checklist provided (cannot automate without access)
6. ✅ **Endpoints**: Validates /health and /status
7. ✅ **File Existence**: Checks all expected public files
8. ✅ **Drift Documentation**: Template and guide provided
9. ✅ **Reconciliation**: Complete procedures documented
10. ✅ **Resolution Plan**: Multiple scenarios covered

## Conclusion

The deployment drift audit tool provides a comprehensive, automated solution for validating server deployments against repository configuration. With detailed documentation and clear remediation procedures, it enables reliable drift detection and resolution while minimizing manual effort and human error.
