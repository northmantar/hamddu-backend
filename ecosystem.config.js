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
      script: '/usr/local/bin/serve',
      args: ['poc', '-l', 'tcp://0.0.0.0:4000', '--no-clipboard'],
      autorestart: true,
      watch: false,
    },
  ],
};
  