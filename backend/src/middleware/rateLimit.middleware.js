import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const isDev = config.env === 'development' || !config.env || config.env === 'test';

/** General API cap — relaxed in development so local testing does not lock you out */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100_000 : (config.rateLimit?.max || 1000),
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path?.startsWith('/portal/'),
});

/** Login brute-force protection — only failed attempts count; dev limit is much higher */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : (config.rateLimit?.authMax || 50),
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

