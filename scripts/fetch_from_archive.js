// scripts/fetch_from_archive.js
// Node script to fetch MP3 files for readers that have archive.org collections.
// It reads data/recitations_archive_targets.json and downloads MP3 files from archive.org metadata API.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetsPath = path.join(__dirname, '..', 'data', 'recitations_archive_targets.json');
const outputBase = path.join(__dirname, '..', 'public', 'audio');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
}

async function main() {
  if (!fs.existsSync(targetsPath)) {
    console.error('targets file not found:', targetsPath);
    process.exit(1);
  }
  const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf-8'));
  await ensureDir(outputBase);

  for (const t of targets) {
    if (!t.archive_id) {
      console.log('Skipping', t.id, '- no archive_id');
      continue;
    }
    try {
      console.log('Fetching metadata for', t.name, '(', t.archive_id, ')');
      const metaUrl = `https://archive.org/metadata/${t.archive_id}`;
      const meta = await fetchJson(metaUrl);
      const files = meta.files || [];
      // prefer MP3 or VBR MP3 formats
      const mp3Files = files.filter(f => (f.format && /mp3/i.test(f.format)) && f.name && !/sample|thumb|jpg|png/i.test(f.name));
      if (mp3Files.length === 0) {
        console.warn('No mp3 files found for', t.archive_id);
        continue;
      }

      const readerDir = path.join(outputBase, t.id);
      await ensureDir(readerDir);

      // Download all MP3s (WARNING: can be large). We'll limit to first 10 for safety in this script run.
      const limit = process.env.DOWNLOAD_LIMIT ? parseInt(process.env.DOWNLOAD_LIMIT) : 30;
      console.log(`Found ${mp3Files.length} mp3 files, will download up to ${limit}`);
      let count = 0;
      for (const f of mp3Files) {
        if (count >= limit) break;
        const fileUrl = `https://archive.org/download/${t.archive_id}/${encodeURIComponent(f.name)}`;
        const dest = path.join(readerDir, f.name);
        if (fs.existsSync(dest)) { console.log('Already exists:', f.name); count++; continue; }
        console.log('Downloading', f.name);
        await downloadFile(fileUrl, dest);
        count++;
      }
      console.log('Done fetching for', t.name);
    } catch (e) {
      console.error('Error fetching for', t.name, e.message);
    }
  }
}

main().catch(e => { console.error('Fatal', e); process.exit(1); });
