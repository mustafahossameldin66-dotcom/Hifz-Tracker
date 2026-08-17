# Archive Fetch Instructions

This script (`scripts/fetch_from_archive.js`) downloads MP3 files for readers that have archive.org collections. It uses the Archive.org metadata API to list available files and downloads MP3 files into `public/audio/<readerId>/`.

Usage:
1. Ensure you have Node 18+ (for fetch support) or run with a fetch polyfill.
2. npm install (if not already)
3. Optionally set DOWNLOAD_LIMIT to limit number of MP3s per reader (default 30):
   - DOWNLOAD_LIMIT=10 node scripts/fetch_from_archive.js
4. Run:
   - node scripts/fetch_from_archive.js

Files will be written to `public/audio/<readerId>/`.

Notes:
- Downloads can be large; run with a limit first to test (e.g., DOWNLOAD_LIMIT=5).
- This script downloads directly from archive.org — it does not add files to the git repo. If you want me to upload the files into the repository, confirm explicitly (note: large repo size).