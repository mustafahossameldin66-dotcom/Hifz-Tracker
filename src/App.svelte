<script>
  import { onMount } from 'svelte';
  import { db, ensureDB } from './lib/db';
  import { getTodaySnapshot } from './lib/prayTimesWrapper';
  import { hijriFromDate } from './lib/hijriWrapper';
  import readers from '../data/readers.json';
  import { requestNotificationPermission, showLocalNotification } from './lib/notifications';
  import { downloadAudioForReader, isAudioCached, playRemote, prefetchAudio } from './lib/audioManager';
  import { scheduleNewItem, getDueForDate } from './lib/scheduler';
  import { APP_CONFIG } from './config';

  let todaySnapshot = { newItems: [], reviews: [], prayerRow: null };
  let hijriDay = '';
  let readersList = readers;
  let notificationGranted = false;
  let dueItems = [];

  onMount(async () => {
    await ensureDB();
    todaySnapshot = await getTodaySnapshot('cairo', new Date());
    hijriDay = hijriFromDate(new Date());
    notificationGranted = Notification.permission === 'granted';
    dueItems = await getDueForDate(new Date());

    // Prefetch: try to prefetch the "آية اليوم" or a small sample if configured
    try {
      const recs = (await import('../data/recitations.json')).default;
      for (const r of recs) {
        // if there is a provided sample_url, prefetch it (non-blocking)
        if (r.sample_url && r.sample_url.length) {
          prefetchAudio(r.sample_url);
        }
      }
    } catch (e) {
      // no samples provided — fine
      console.log('no recitation samples to prefetch');
    }
  });

  async function enableNotifications() {
    const ok = await requestNotificationPermission();
    notificationGranted = ok;
    if (ok) showLocalNotification('Rafiq Quran', 'تم تفعيل الإشعارات');
  }

  async function downloadSample(reader) {
    // If recitations.json contains sample_url entries we use them. Otherwise prompt user for a URL.
    const recs = (await import('../data/recitations.json')).default;
    const found = recs.find(x => x.id === reader.id);
    let url = found?.sample_url || '';
    if (!url) {
      url = prompt('أدخل رابط MP3 مباشر للتلاوة (أو اضغط إلغاء للإيقاف):');
      if (!url) return;
    }
    const ok = await downloadAudioForReader(reader.id, url);
    alert(ok ? 'تم تنزيل العينة وحفظها أوفلاين' : 'فشل تنزيل العينة');
  }

  async function playReaderSample(reader) {
    // try to determine a sample URL from recitations.json (sample_url)
    const recs = (await import('../data/recitations.json')).default;
    const found = recs.find(x => x.id === reader.id);
    let url = found?.sample_url || '';
    if (!url) {
      // if not available, ask user for a URL (for now)
      url = prompt('أدخل رابط MP3 مباشر للتشغيل (أو اضغط إلغاء):');
      if (!url) return;
    }
    try {
      const result = await playRemote(url);
      console.log('playRemote result', result);
    } catch (e) {
      alert('فشل التشغيل: ' + (e.message || e));
    }
  }

  async function startNow(item) {
    alert('بدء جلسة: ' + (item.title || 'عنصر'));
  }
</script>

<style>
  .app { padding: 1rem; font-family: system-ui, sans-serif; direction: rtl }
  header { background: linear-gradient(#023, #056); color: white; padding: 1rem; border-radius: 8px }
  .card { background: white; padding: 1rem; margin: 0.6rem 0; border-radius: 8px }
  button { margin-left: 0.5rem }
</style>

<div class="app">
  <header>
    <h1>{APP_CONFIG.APP_NAME}</h1>
    <div>اليوم الهجري: {hijriDay}</div>
  </header>

  <section class="card">
    <h2>ملخص اليوم</h2>
    <div>مواقيت الصلاة اليوم: {todaySnapshot.prayerRow ? todaySnapshot.prayerRow.maghrib : 'غير متوفر (يؤخذ حسابياً)'}</div>
    <div>عناصر مجدولة اليوم: {dueItems.length}</div>
    <button on:click={enableNotifications}>{notificationGranted ? 'تم تفعيل الإشعارات' : 'تفعيل الإشعارات'}</button>
  </section>

  <section class="card">
    <h2>القراء المتاحون</h2>
    <ul>
      {#each readersList as r}
        <li>{r.name}
          <button on:click={() => playReaderSample(r)}>تشغيل عند الطلب</button>
          <button on:click={() => downloadSample(r)}>تحميل أوفلاين</button>
        </li>
      {/each}
    </ul>
  </section>

  <section class="card">
    <h2>المراجعات اليوم</h2>
    {#if dueItems.length === 0}
      <div>لا مراجعات اليوم.</div>
    {:else}
      <ul>
        {#each dueItems as d}
          <li>{d.itemId} <button on:click={() => startNow(d)}>ابدأ</button></li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
