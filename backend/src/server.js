import http from 'http';
import os from 'os';
import config from './config/index.js';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';
import { assignmentEngine } from './modules/assignment/assignment.engine.js';

const app = createApp();
const server = http.createServer(app);

/** Bind all interfaces so LAN devices can reach API directly if needed */
const HOST = process.env.HOST || '0.0.0.0';

if (config.env !== 'test') {
  initSocket(server);

  setInterval(() => {
    assignmentEngine.processExpiredOffers().catch((err) => {
      console.error('[assignment] expired offer processor:', err.message);
    });
  }, 30000);

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
