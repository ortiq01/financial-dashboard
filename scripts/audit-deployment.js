#!/usr/bin/env node

/**
 * Deployment Drift Audit Tool
 * 
 * This script verifies that the deployed server environment matches the expected
 * configuration from the repository. It checks:
 * 
 * - PM2 process configuration (cwd, env vars)
 * - DEFAULT_PATH setting (portal vs unified)
 * - Root redirect behavior
 * - Critical file existence (reports, data, portal files)
 * - Health and status endpoints
 * - Server accessibility
 * 
 * Usage:
 *   node scripts/audit-deployment.js [--environment=production|nonprod]
 *   
 * Options:
 *   --environment=production  Check production config (default)
 *   --environment=nonprod     Check non-prod config
 *   --server-url=URL          Override server URL for checks
 *   --skip-http               Skip HTTP endpoint checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name) => args.includes(`--${name}`);

const environment = getArg('environment', 'production');
const skipHttp = hasFlag('skip-http');
const serverUrlOverride = getArg('server-url', null);

// Configuration based on environment
const configs = {
  production: {
    name: 'financial-dashboard-production',
    cwd: '/opt/apps/financial-dashboard',
    port: 3002,
    serverUrl: 'http://127.0.0.1:3002',
    defaultPath: '/reports/unified_dashboard.html',
    disableRootRedirect: '0',
    configFile: 'ecosystem.production.config.cjs'
  },
  nonprod: {
    name: 'financial-dashboard-nonprod',
    cwd: '/opt/apps/financial-dashboard-non-prod',
    port: 3102,
    serverUrl: 'http://127.0.0.1:3102',
    defaultPath: '/reports/unified_dashboard.html',
    disableRootRedirect: '0',
    configFile: 'ecosystem.nonprod.config.cjs'
  }
};

const config = configs[environment];
if (!config) {
  console.error(`❌ Invalid environment: ${environment}. Use 'production' or 'nonprod'.`);
  process.exit(1);
}

// Override server URL if provided
if (serverUrlOverride) {
  config.serverUrl = serverUrlOverride;
}

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 Deployment Drift Audit Tool');
console.log('═══════════════════════════════════════════════════════');
console.log(`Environment: ${environment}`);
console.log(`Expected PM2 app name: ${config.name}`);
console.log(`Expected cwd: ${config.cwd}`);
console.log(`Expected port: ${config.port}`);
console.log(`Server URL: ${config.serverUrl}`);
console.log('═══════════════════════════════════════════════════════\n');

let issues = [];
let checks = [];

function reportCheck(category, description, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  const msg = `${icon} [${category}] ${description}`;
  console.log(msg);
  if (details) {
    console.log(`   ${details}`);
  }
  checks.push({ category, description, status, details });
  if (status === 'fail') {
    issues.push({ category, description, details });
  }
}

// Check 1: PM2 Process Configuration
console.log('\n📋 PM2 Process Configuration\n' + '─'.repeat(55));
try {
  // Check if PM2 is available
  try {
    execSync('which pm2', { stdio: 'pipe' });
  } catch (e) {
    reportCheck('PM2', 'PM2 availability', 'warn', 'PM2 not found in PATH (expected when not on server)');
  }

  // Try to get PM2 process list
  try {
    const pm2List = execSync('pm2 jlist', { encoding: 'utf8', stdio: 'pipe' });
    const processes = JSON.parse(pm2List);
    const targetProcess = processes.find(p => p.name === config.name);
    
    if (targetProcess) {
      reportCheck('PM2', `Process "${config.name}" exists`, 'pass');
      
      // Check cwd
      const actualCwd = targetProcess.pm2_env.pm_cwd;
      if (actualCwd === config.cwd) {
        reportCheck('PM2', 'Working directory matches', 'pass', `cwd: ${actualCwd}`);
      } else {
        reportCheck('PM2', 'Working directory mismatch', 'fail', 
          `Expected: ${config.cwd}, Actual: ${actualCwd}`);
      }
      
      // Check if directory exists
      if (fs.existsSync(actualCwd)) {
        reportCheck('PM2', 'Working directory exists', 'pass');
      } else {
        reportCheck('PM2', 'Working directory does not exist', 'fail', `Path: ${actualCwd}`);
      }
      
      // Check environment variables
      const env = targetProcess.pm2_env;
      const actualPort = env.PORT;
      const actualDefaultPath = env.DEFAULT_PATH;
      const actualDisableRedirect = env.DISABLE_ROOT_REDIRECT;
      
      if (actualPort == config.port) {
        reportCheck('PM2', 'PORT environment variable', 'pass', `PORT=${actualPort}`);
      } else {
        reportCheck('PM2', 'PORT mismatch', 'warn', 
          `Expected: ${config.port}, Actual: ${actualPort || 'not set'}`);
      }
      
      if (actualDefaultPath === config.defaultPath) {
        reportCheck('PM2', 'DEFAULT_PATH matches', 'pass', `DEFAULT_PATH=${actualDefaultPath}`);
      } else {
        reportCheck('PM2', 'DEFAULT_PATH mismatch', 'warn', 
          `Expected: ${config.defaultPath}, Actual: ${actualDefaultPath || 'not set (defaults to unified)'}`);
      }
      
      if (actualDisableRedirect === config.disableRootRedirect) {
        reportCheck('PM2', 'DISABLE_ROOT_REDIRECT matches', 'pass', 
          `DISABLE_ROOT_REDIRECT=${actualDisableRedirect}`);
      } else {
        reportCheck('PM2', 'DISABLE_ROOT_REDIRECT mismatch', 'warn',
          `Expected: ${config.disableRootRedirect}, Actual: ${actualDisableRedirect || 'not set (defaults to 0)'}`);
      }
      
    } else {
      reportCheck('PM2', `Process "${config.name}" not found`, 'fail', 
        `Available processes: ${processes.map(p => p.name).join(', ') || 'none'}`);
    }
  } catch (e) {
    reportCheck('PM2', 'Unable to query PM2 processes', 'warn', 
      'Not running on server or PM2 not accessible');
  }
} catch (e) {
  reportCheck('PM2', 'PM2 check failed', 'warn', e.message);
}

// Check 2: Repository Configuration Files
console.log('\n📄 Repository Configuration Files\n' + '─'.repeat(55));
const configFilePath = path.join(rootDir, config.configFile);
if (fs.existsSync(configFilePath)) {
  reportCheck('Config', `${config.configFile} exists`, 'pass');
  
  try {
    const configContent = fs.readFileSync(configFilePath, 'utf8');
    
    // Check if config contains expected values
    if (configContent.includes(config.cwd)) {
      reportCheck('Config', 'Config file contains correct cwd', 'pass');
    } else {
      reportCheck('Config', 'Config file cwd mismatch', 'fail', 
        `Expected cwd: ${config.cwd} not found in config`);
    }
    
    if (configContent.includes(`PORT: '${config.port}'`) || 
        configContent.includes(`PORT: "${config.port}"`)) {
      reportCheck('Config', 'Config file contains correct PORT', 'pass');
    } else {
      reportCheck('Config', 'Config file PORT mismatch', 'warn', 
        `Expected PORT: ${config.port} format not found`);
    }
  } catch (e) {
    reportCheck('Config', 'Unable to read config file', 'warn', e.message);
  }
} else {
  reportCheck('Config', `${config.configFile} not found`, 'fail', `Path: ${configFilePath}`);
}

// Check 3: Expected Files Existence
console.log('\n📁 Expected Files Existence\n' + '─'.repeat(55));
const expectedFiles = [
  'public/reports/unified_dashboard.html',
  'public/index.html',
  'server.js',
  'package.json'
];

const expectedDirs = [
  'public/data',
  'public/reports'
];

// Check from repository perspective (always accessible)
for (const file of expectedFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    reportCheck('Files', `${file} exists in repo`, 'pass');
  } else {
    reportCheck('Files', `${file} missing in repo`, 'fail', `Path: ${filePath}`);
  }
}

for (const dir of expectedDirs) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    reportCheck('Files', `${dir}/ exists in repo`, 'pass');
  } else {
    reportCheck('Files', `${dir}/ missing in repo`, 'fail', `Path: ${dirPath}`);
  }
}

// Check sample data files
const dataDir = path.join(rootDir, 'public/data');
if (fs.existsSync(dataDir)) {
  const dataFiles = fs.readdirSync(dataDir).filter(f => !f.startsWith('.'));
  if (dataFiles.length > 0) {
    reportCheck('Files', 'Data directory has sample files', 'pass', 
      `Found: ${dataFiles.slice(0, 3).join(', ')}${dataFiles.length > 3 ? '...' : ''}`);
  } else {
    reportCheck('Files', 'Data directory is empty', 'warn', 
      'No sample data files found (may be expected)');
  }
}

// Check on server deployment if cwd exists
if (fs.existsSync(config.cwd)) {
  reportCheck('Files', 'Deployment directory exists', 'pass', config.cwd);
  
  for (const file of expectedFiles) {
    const filePath = path.join(config.cwd, file);
    if (fs.existsSync(filePath)) {
      reportCheck('Files', `${file} exists on server`, 'pass');
    } else {
      reportCheck('Files', `${file} missing on server`, 'fail', `Path: ${filePath}`);
    }
  }
} else {
  reportCheck('Files', 'Deployment directory check skipped', 'warn', 
    `Not running on server (${config.cwd} not accessible)`);
}

// Check 4: HTTP Endpoints
if (!skipHttp) {
  console.log('\n🌐 HTTP Endpoints\n' + '─'.repeat(55));
  
  const checkEndpoint = (path, expectedStatus = 200) => {
    return new Promise((resolve) => {
      const url = new URL(path, config.serverUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            success: true,
            status: res.statusCode,
            data: data.substring(0, 200)
          });
        });
      });
      
      req.on('error', (e) => {
        resolve({ success: false, error: e.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });
      
      req.end();
    });
  };
  
  // Check /health endpoint
  const healthResult = await checkEndpoint('/health');
  if (healthResult.success && healthResult.status === 200) {
    reportCheck('HTTP', '/health endpoint', 'pass', 
      `Status: ${healthResult.status}`);
    try {
      const healthData = JSON.parse(healthResult.data);
      if (healthData.status === 'ok') {
        reportCheck('HTTP', '/health returns valid response', 'pass', 
          `service: ${healthData.service}`);
      }
    } catch (e) {
      reportCheck('HTTP', '/health response parsing', 'warn', 'Could not parse JSON');
    }
  } else {
    reportCheck('HTTP', '/health endpoint', 'fail', 
      healthResult.error || `Status: ${healthResult.status}`);
  }
  
  // Check /status endpoint
  const statusResult = await checkEndpoint('/status');
  if (statusResult.success && statusResult.status === 200) {
    reportCheck('HTTP', '/status endpoint', 'pass', 
      `Status: ${statusResult.status}`);
  } else {
    reportCheck('HTTP', '/status endpoint', 'fail', 
      statusResult.error || `Status: ${statusResult.status}`);
  }
  
  // Check root redirect behavior
  const rootResult = await checkEndpoint('/');
  if (rootResult.success) {
    if (rootResult.status === 302 || rootResult.status === 301) {
      reportCheck('HTTP', 'Root redirect active', 'pass', 
        `Status: ${rootResult.status} (redirect enabled)`);
    } else if (rootResult.status === 200) {
      if (config.disableRootRedirect === '1') {
        reportCheck('HTTP', 'Root serves content (redirect disabled)', 'pass', 
          'DISABLE_ROOT_REDIRECT=1 as expected');
      } else {
        reportCheck('HTTP', 'Root redirect', 'warn', 
          'Expected redirect but got 200 (may be expected with ?noredirect)');
      }
    } else {
      reportCheck('HTTP', 'Root endpoint', 'warn', 
        `Unexpected status: ${rootResult.status}`);
    }
  } else {
    reportCheck('HTTP', 'Root endpoint', 'fail', rootResult.error);
  }
  
  // Check unified dashboard
  const dashboardResult = await checkEndpoint('/reports/unified_dashboard.html');
  if (dashboardResult.success && dashboardResult.status === 200) {
    reportCheck('HTTP', '/reports/unified_dashboard.html accessible', 'pass');
  } else {
    reportCheck('HTTP', '/reports/unified_dashboard.html', 'fail', 
      dashboardResult.error || `Status: ${dashboardResult.status}`);
  }
  
} else {
  console.log('\n🌐 HTTP Endpoints\n' + '─'.repeat(55));
  reportCheck('HTTP', 'HTTP checks skipped', 'warn', '--skip-http flag provided');
}

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 Audit Summary');
console.log('═══════════════════════════════════════════════════════');

const passed = checks.filter(c => c.status === 'pass').length;
const warnings = checks.filter(c => c.status === 'warn').length;
const failed = checks.filter(c => c.status === 'fail').length;

console.log(`Total checks: ${checks.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Failed: ${failed}`);

if (issues.length > 0) {
  console.log('\n🚨 Issues Detected:');
  console.log('─'.repeat(55));
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.category}] ${issue.description}`);
    if (issue.details) {
      console.log(`   ${issue.details}`);
    }
  });
  
  console.log('\n📋 Recommended Actions:');
  console.log('─'.repeat(55));
  console.log('1. Review the issues above and verify server configuration');
  console.log('2. Compare PM2 config with repository ecosystem config files');
  console.log('3. Ensure all expected files exist in deployment directory');
  console.log('4. Restart PM2 process after fixing configuration:');
  console.log(`   pm2 restart ${config.name}`);
  console.log('5. Or redeploy from latest main branch:');
  console.log(`   cd ${config.cwd}`);
  console.log('   git pull origin main');
  console.log('   npm install');
  console.log(`   pm2 restart ${config.name}`);
}

console.log('\n═══════════════════════════════════════════════════════');

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
