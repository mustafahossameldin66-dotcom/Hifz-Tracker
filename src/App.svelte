<script>
  import { onMount } from 'svelte';
  import { db, ensureDB } from './lib/db';
  import { getTodaySnapshot } from './lib/prayTimesWrapper';
  import { hijriFromDate } from './lib/hijriWrapper';
  import readers from '../data/readers.json';
  import { requestNotificationPermission, showLocalNotification, scheduleInAppReminder } from './lib/notifications';
  import { downloadAudioForReader, isAudioCached } from './lib/audioManager';
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
  });

  async function enableNotifications() {
    const ok = await requestNotificationPermission();
    notificationGranted = ok;
    if (ok) showLocalNotification('Rafiq Quran', 'تم تفعيل الإشعارات');
  }

  async function downloadSample(reader) {
    // NOTE: URLs are placeholders; in production replace with real audio URLs or allow user upload
    const sampleUrl = `https://cdn.example.com/recitations/${reader.id}.mp3`;
    const ok = await downloadAudioForReader(reader.id, sampleUrl);
    if (ok) alert('تم تنزيل عينة صوتية (تجريبي)'); else alert('فشل تنزيل العينة');
  }

  async function startNow(item) {
    alert('بدء جلسة: ' + (item.title || 'عنصر'));
    // mark first schedule done for demo
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
        <li>{r.name} <button on:click={() => downloadSample(r)}>تحميل عينة</button></li>
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
