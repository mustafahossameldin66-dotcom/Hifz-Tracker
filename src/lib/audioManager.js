// audioManager.js
// Enhanced audio manager: on-demand streaming with caching (Cache Storage)

import { db } from './db';

const AUDIO_CACHE = 'audio-assets';

export async function isAudioCached(url) {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const match = await cache.match(url);
    return !!match;
  } catch (e) {
    console.warn('isAudioCached failed', e);
    return false;
  }
}

export async function cacheAudioResponse(url, response) {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    await cache.put(url, response.clone());
    return true;
  } catch (e) {
    console.warn('cacheAudioResponse failed', e);
    return false;
  }
}

export async function fetchAndCacheAudio(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Network response not ok');
    await cacheAudioResponse(url, res);
    return true;
  } catch (e) {
    console.warn('fetchAndCacheAudio failed', e);
    return false;
  }
}

export async function playRemote(url) {
  try {
    // If cached, use cached blob
    const cache = await caches.open(AUDIO_CACHE);
    const cached = await cache.match(url);
    if (cached) {
      const blob = await cached.blob();
      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      audio.play().catch(e => console.warn('audio.play failed', e));
      return { source: 'cache' };
    }

    // Not cached: stream from network and cache in background
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.play().catch(e => console.warn('audio.play failed', e));

    // fetch and cache in background (don't block playback)
    fetch(url, { mode: 'cors' })
      .then(resp => {
        if (resp.ok) cache.put(url, resp.clone()).catch(err => console.warn('cache put failed', err));
      })
      .catch(err => console.warn('background fetch failed', err));

    return { source: 'network' };
  } catch (e) {
    console.error('playRemote failed', e);
    throw e;
  }
}

export async function prefetchAudio(url) {
  // tries to fetch and cache the audio file for later offline use
  try {
    const already = await isAudioCached(url);
    if (already) return true;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('prefetch fetch failed');
    await cacheAudioResponse(url, res);
    return true;
  } catch (e) {
    console.warn('prefetchAudio failed', e);
    return false;
  }
}

export async function downloadAudioForReader(readerId, url) {
  // wrapper to download and register metadata in IndexedDB (useful when downloaded via script)
  try {
    const ok = await fetchAndCacheAudio(url);
    if (ok) {
      await db.audio_assets.add({ key: url, title: `${readerId} - ${url.split('/').pop()}`, availableOffline: true });
      return true;
    }
    return false;
  } catch (e) {
    console.error('downloadAudioForReader', e);
    return false;
  }
}
