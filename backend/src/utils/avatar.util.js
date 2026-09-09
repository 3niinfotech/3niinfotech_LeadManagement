import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');

export function deleteStoredAvatar(publicPath) {
  if (!publicPath || !String(publicPath).startsWith('/uploads/')) return;
  const relative = String(publicPath).split('?')[0].replace(/^\/uploads\//, '');
  const absolute = path.resolve(uploadsRoot, relative);
  if (!absolute.startsWith(`${uploadsRoot}${path.sep}`) || !fs.existsSync(absolute)) return;
  fs.unlinkSync(absolute);
}

export function isSupportedImageFile(filePath) {
  const bytes = fs.readFileSync(filePath).subarray(0, 12);
  const hex = bytes.toString('hex');
  const jpeg = hex.startsWith('ffd8ff');
  const png = hex.startsWith('89504e470d0a1a0a');
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.toString('ascii', 8, 12) === 'WEBP';
  return jpeg || png || webp;
}

export function buildAvatarPath(relativeDir, filename) {
  return `/uploads/${relativeDir}/${filename}`;
}
