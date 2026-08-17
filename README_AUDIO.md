# Rafiq Quran — Audio fetch instructions

This script and data file let you fetch recitation audio files for the selected readers and store them locally under `public/audio/`.

Important notes:
- The project does not include any copyrighted audio by default. You must provide public URLs to audio files you have rights to use (or that are licensed for distribution).
- The script `scripts/fetch_recitations.js` reads `data/recitations.json` and downloads `sample_url` for each reader into `public/audio/<readerId>/`.

How to use locally:
1. Fill `data/recitations.json` `sample_url` fields with direct URLs to the MP3 files you want to use.
2. Run:
   - node --version (recommended >=18)
   - npm install
   - node scripts/fetch_recitations.js
3. The downloaded files will be available under `public/audio/` and can be served by the dev server.

If you want me to automatically fetch known public recitations for the six readers, reply here with a confirmation and I'll attempt to discover available public links and populate `data/recitations.json` for you. I will list all sources and their licenses before downloading.
