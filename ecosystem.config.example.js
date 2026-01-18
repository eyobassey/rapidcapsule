module.exports = {
  apps: [
    {
      name: 'RC-Frontend',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: './RC/dist',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
      },
    },
    {
      name: 'RC-Backend',
      cwd: './RC-Backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5020,
        // Database
        MONGODB_URI: 'mongodb://your-mongodb-uri',
        // Authentication
        JWT_SECRET: 'your-jwt-secret',
        JWT_REFRESH_SECRET: 'your-refresh-secret',
        // Google OAuth
        GOOGLE_CLIENT_ID: 'your-google-client-id',
        GOOGLE_CLIENT_SECRET: 'your-google-client-secret',
        // AWS
        AWS_ACCESS_KEY_ID: 'your-aws-access-key',
        AWS_SECRET_ACCESS_KEY: 'your-aws-secret-key',
        AWS_BUCKET_NAME: 'your-bucket-name',
        AWS_REGION: 'eu-west-2',
        // Zoom
        ZOOM_ACCOUNT_ID: 'your-zoom-account-id',
        ZOOM_CLIENT_ID: 'your-zoom-client-id',
        ZOOM_CLIENT_SECRET: 'your-zoom-client-secret',
        // Twilio
        TWILIO_ACCOUNT_SID: 'your-twilio-sid',
        TWILIO_AUTH_TOKEN: 'your-twilio-token',
        // Paystack
        PAYSTACK_SECRET_KEY: 'your-paystack-secret',
        // Infermedica
        INFERMEDICA_APP_ID: 'your-infermedica-id',
        INFERMEDICA_APP_KEY: 'your-infermedica-key',
      },
    },
    {
      name: 'RC-Admin-Frontend',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: './RC_Admin_UI/dist',
        PM2_SERVE_PORT: 8080,
        PM2_SERVE_SPA: 'true',
      },
    },
    {
      name: 'RC-Backend-Admin',
      cwd: './RC_Admin_Backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5021,
        MONGODB_URI: 'mongodb://your-mongodb-uri',
        JWT_SECRET: 'your-jwt-secret',
      },
    },
  ],
};
