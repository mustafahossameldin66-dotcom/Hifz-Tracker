// scripts/fetch_recitations.js
// Node script to download recitation files listed in data/recitations.json
// Usage: node scripts/fetch_recitations.js
// It will create ./public/audio/<readerId>/ folders and download files there.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const recitationsPath = path.join(__dirname, '..', 'data', 'recitations.json');
const outputDir = path.join(__dirname, '..', 'public', 'audio');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
}

async function main() {
  if (!fs.existsSync(recitationsPath)) {
    console.error('recitations.json not found at', recitationsPath);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(recitationsPath, 'utf-8'));
  await ensureDir(outputDir);

  for (const rec of data) {
    if (!rec.sample_url || rec.sample_url.trim() === '') {
      console.log(`Skipping ${rec.name} (${rec.id}) — no URL provided`);
      continue;
    }
    try {
      const readerDir = path.join(outputDir, rec.id);
      await ensureDir(readerDir);
      const filename = path.basename(new URL(rec.sample_url).pathname);
      const dest = path.join(readerDir, filename);
      console.log(`Downloading ${rec.name} from ${rec.sample_url} → ${dest}`);
      await downloadFile(rec.sample_url, dest);
      console.log('Done');
    } catch (e) {
      console.error('Error fetching', rec.name, e.message);
    }
  }
}

main().catch(e => {
  console.error('Fatal error', e);
  process.exit(1);
});
