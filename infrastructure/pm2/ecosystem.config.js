module.exports = {
  apps: [
    {
      name: 'albero-api',
      cwd: '/var/www/albard/api',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3300,
      },
      error_file: '/var/www/albard/logs/api-error.log',
      out_file: '/var/www/albard/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'albero-frontend',
      cwd: '/var/www/albard/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3301',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3301,
      },
      error_file: '/var/www/albard/logs/frontend-error.log',
      out_file: '/var/www/albard/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};

