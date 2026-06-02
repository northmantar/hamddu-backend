module.exports = {
  apps: [
    {
      name: 'hamddu-backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'hamddu-admin',
      cwd: './admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 4000',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
