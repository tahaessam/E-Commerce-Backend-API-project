export default () => ({
  port: parseInt(process.env.PORT ?? '3000'),

  database: {
    url: process.env.DB_URL,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,

    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    refreshTtlSeconds: process.env.REFRESH_TOKEN_TTL_SECONDS,
  },

  mailer: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587'),
    secure: process.env.MAIL_SECURE === 'true',

    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM,
  },

  s3: {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
  },
});
