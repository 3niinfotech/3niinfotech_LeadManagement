/**
 * Dev CORS — allow localhost + private LAN origins so phones/other PCs
 * can hit Vite (e.g. http://192.168.x.x:3000) with API proxy / direct API.
 */
export function isAllowedDevOrigin(origin) {
  if (!origin) return true; // same-origin / curl / mobile webviews without Origin

  try {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const host = url.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;

    // Private / link-local IPv4
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (host.endsWith('.local')) return true;

    return false;
  } catch {
    return false;
  }
}

export default { isAllowedDevOrigin };
