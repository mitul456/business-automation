module.exports = {
  apps: [
    {
      name: 'omniflow-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        APP_BASE_URL: 'https://omniflow.antcodes.dev',
      },
    },
    {
      name: 'omniflow-worker',
      cwd: './apps/worker',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        APP_BASE_URL: 'https://omniflow.antcodes.dev',
      },
    },
    {
      name: 'omniflow-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_APP_URL: 'https://omniflow.antcodes.dev',
        NEXT_PUBLIC_API_URL: 'https://omniflow.antcodes.dev/api/v1',
        NEXT_PUBLIC_SOCKET_URL: 'https://omniflow.antcodes.dev',
      },
    },
  ],
};
