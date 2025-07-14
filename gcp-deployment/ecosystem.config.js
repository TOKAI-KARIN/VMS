module.exports = {
  apps: [
    {
      name: 'vehicle-management-client',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/vehicle-management/client',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        REACT_APP_API_URL: 'https://your-domain.com/api'
      },
      error_file: '/var/log/pm2/client-error.log',
      out_file: '/var/log/pm2/client-out.log',
      log_file: '/var/log/pm2/client-combined.log',
      time: true
    },
    {
      name: 'vehicle-management-server',
      script: 'index.js',
      cwd: '/var/www/vehicle-management/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'vehicle_management',
        DB_USER: 'postgres',
        DB_PASSWORD: 'your-db-password'
      },
      error_file: '/var/log/pm2/server-error.log',
      out_file: '/var/log/pm2/server-out.log',
      log_file: '/var/log/pm2/server-combined.log',
      time: true
    }
  ]
}; 