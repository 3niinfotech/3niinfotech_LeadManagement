import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { initSocket } from './socket/index.js';
import { assignmentEngine } from './modules/assignment/assignment.engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: config.env === 'development'
    ? (origin, callback) => {
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : config.cors.origin,
  credentials: true,
}));
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));
app.use('/api', apiLimiter, routes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

initSocket(server);

setInterval(() => {
  assignmentEngine.processExpiredOffers().catch((err) => {
    console.error('[assignment] expired offer processor:', err.message);
  });
}, 30000);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.env}]`);
});

export default app;
