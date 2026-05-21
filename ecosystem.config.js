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
      name: 'hamddu-admin-poc',
      script: 'serve',
      args: ['poc', '-l', '4000', '--no-clipboard'],
      interpreter: 'none',
      autorestart: true,
      watch: false,
    },
  ],
};
  