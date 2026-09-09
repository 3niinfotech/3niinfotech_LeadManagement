import http from 'http';
import os from 'os';
import config from './config/index.js';
import prisma from './config/database.js';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';
import { assignmentEngine } from './modules/assignment/assignment.engine.js';
import { reconcileExpiredDemoAttendance } from './modules/enquiry/enquiry.service.js';
import { processSlaBatch } from './modules/assignment/sla.service.js';
import { processSmartReminderBatch } from './modules/enquiry/enquirySmartReminder.service.js';

const app = createApp();
const server = http.createServer(app);

/** Bind all interfaces so LAN devices can reach API directly if needed */
const HOST = process.env.HOST || '0.0.0.0';

async function assertDatabaseReady() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[startup] Database connected');
  } catch (err) {
    console.error('[startup] Database connection failed:', err.message);
    console.error('Fix DATABASE_URL in backend/.env, then run: npm run db:generate && npm run db:push');
    process.exit(1);
  }
}

if (config.env !== 'test') {
  await assertDatabaseReady();

  initSocket(server);

  setInterval(() => {
    assignmentEngine.processExpiredOffers().catch((err) => {
      console.error('[assignment] expired offer processor:', err.message);
    });
  }, 30000);

  // Demo attendance: auto-absent after class window ends (server-side)
  setInterval(() => {
    reconcileExpiredDemoAttendance().catch((err) => {
      console.error('[demo] auto-absent processor:', err.message);
    });
  }, 60000);

  // SLA evaluation — response-time tiers, manager alerts, optional auto-reassign
  setInterval(() => {
    processSlaBatch().catch((err) => {
      console.error('[sla] processor:', err.message);
    });
  }, 60000);

  // Smart follow-up reminders (when automation.auto_followup enabled per company)
  setInterval(() => {
    processSmartReminderBatch().catch((err) => {
      console.error('[smart-reminder] processor:', err.message);
    });
  }, 300000);

  function listLanIPv4() {
    const nets = os.networkInterfaces();
    const ips = [];
    Object.values(nets).forEach((list) => {
      (list || []).forEach((net) => {
        if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
      });
    });
    return ips;
  }

  server.listen(config.port, HOST, () => {
    const lan = listLanIPv4();
    console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${config.port} [${config.env}]`);
    if (config.env === 'development' && lan.length) {
      console.log('LAN access (other devices):');
      lan.forEach((ip) => {
        console.log(`  Frontend → http://${ip}:3000`);
        console.log(`  API      → http://${ip}:${config.port}/api/health`);
      });
      console.log('Tip: open the Frontend URL on phone/PC — Vite proxies /api to this backend.');
    }
  });
}

export default app;
