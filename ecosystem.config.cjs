module.exports = {
  apps: [{
    name: 'financial-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/opt/apps/financial-dashboard',
    env: { PORT: '3002', NODE_ENV: 'production' }
  }]
}
