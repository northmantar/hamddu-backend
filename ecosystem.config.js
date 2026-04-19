module.exports = {
    apps: [
      {
        name: 'hamddu-backend',
        script: 'dist/main.js',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          // NODE_ENV: 'production',
          NODE_ENV: 'development',
        },
      },
    ],
  };
  