import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('frontend/src');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if ((line.includes('apiGet(') || line.includes('apiPost(') || line.includes('apiPut(') || line.includes('apiPatch(') || line.includes('apiDelete(') || line.includes('apiClient.')) && line.includes('/api/')) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
}

