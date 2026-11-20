import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || '3NI INFOTECH',
    fromEmail: process.env.SMTP_FROM || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@3niinfotech.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'info@3niinfotech.com',
    appName: process.env.APP_NAME || '3ni Infotech',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    otpExpireMinutes: parseInt(process.env.OTP_EXPIRE_MINUTES, 10) || 1,
    forceLogoCid: process.env.EMAIL_LOGO_FORCE === 'true',
    embedLogoInline: process.env.EMAIL_EMBED_LOGO_INLINE === 'true',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  },
};

export default config;
