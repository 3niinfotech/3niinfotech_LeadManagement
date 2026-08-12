import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const isDev = config.env === 'development';

/** General API cap — relaxed in development so local testing does not lock you out */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isDev ? 10_000 : config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

/** Login brute-force protection — only failed attempts count; dev limit is much higher */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isDev ? 500 : config.rateLimit.authMax,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
