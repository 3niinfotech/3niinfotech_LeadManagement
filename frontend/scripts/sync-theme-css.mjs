/**
 * Generates src/theme/theme-vars.css from colors.theme.js (light mode defaults).
 * Run: npm run sync:theme
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { lightTokens } from '../src/theme/tokens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/theme/theme-vars.css');

const lines = Object.entries(lightTokens)
  .map(([key, value]) => `  --${key}: ${value};`)
  .join('\n');

const css = `/* AUTO-GENERATED — do not edit. Source: src/theme/colors.theme.js */
/* Run: npm run sync:theme */
:root {
${lines}
  --radius-card: 8px;
  --radius-button: 6px;
  --radius-modal: 12px;
}
`;

writeFileSync(outPath, css, 'utf8');
console.log(`✓ theme-vars.css synced (${Object.keys(lightTokens).length} tokens)`);
