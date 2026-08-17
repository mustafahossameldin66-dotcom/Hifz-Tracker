// audioManager.js
// download remote audio (user-provided URL) to cache and register metadata in IndexedDB

import { db } from './db';

export async function downloadAudioForReader(readerId, url) {
  try {
    const cache = await caches.open('audio-assets');
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('Audio download failed');
    await cache.put(url, resp.clone());
    // register metadata
    await db.audio_assets.add({ key: url, title: `${readerId} - ${url.split('/').pop()}`, availableOffline: true });
    return true;
  } catch (e) {
    console.error('downloadAudioForReader', e);
    return false;
  }
}

export async function isAudioCached(url) {
  const cache = await caches.open('audio-assets');
  const match = await cache.match(url);
  return !!match;
}
