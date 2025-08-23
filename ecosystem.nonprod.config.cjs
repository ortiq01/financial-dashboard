module.exports = {
  apps: [{
    name: 'financial-dashboard-nonprod',
    script: 'npm',
    args: 'start',
    cwd: '/opt/apps/financial-dashboard-non-prod',
    env: {
      PORT: '3102',
      NODE_ENV: 'development',
      DEFAULT_PATH: '/reports/unified_dashboard.html',
      DISABLE_ROOT_REDIRECT: '0'
    }
  }]
}
