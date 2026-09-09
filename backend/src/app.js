import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { isAllowedDevOrigin } from './utils/dev-cors.util.js';
import { mountSecureUploads } from './middleware/secureUploads.middleware.js';

const isTest = config.env === 'test';

/**
 * Side-effect-free Express app for HTTP integration tests and server bootstrap.
 */
export function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: {
      policy: config.env === 'development' ? 'cross-origin' : 'same-origin',
    },
  }));

  app.use(cors({
    origin: config.env === 'development'
      ? (origin, callback) => {
        if (isAllowedDevOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin || '(none)'}`));
        }
      }
      : config.cors.origin,
    credentials: true,
  }));

  if (!isTest) {
    app.use(compression());
    app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  mountSecureUploads(app);

  app.get('/api/health', async (_req, res) => {
    try {
      const prisma = (await import('./config/database.js')).default;
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        success: true,
        message: 'API is running',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(503).json({
        success: false,
        message: 'API up but database unreachable',
        database: 'disconnected',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.use('/api', apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
