// Simple SM-2 based scheduler utilities
import { db } from './db';

// Helper to add schedule entries for a new item using spaced repetition baseline
export async function scheduleNewItem(itemId, createdAt = new Date()) {
  // initial: day 0 (learn), then reviews at 1,3,7,14,30 days
  const intervals = [0,1,3,7,14,30];
  const entries = intervals.map((d, idx) => ({
    itemId,
    dueAt: new Date(new Date(createdAt).setDate(createdAt.getDate() + d)).toISOString(),
    type: idx===0 ? 'learn' : 'review',
    done: false,
    score: null
  }));
  await db.schedule_entries.bulkAdd(entries);
  return entries;
}

export async function getDueForDate(date = new Date()) {
  const iso = date.toISOString().slice(0,10);
  // simple: any schedule_entries with dueAt date = iso
  const all = await db.schedule_entries.toArray();
  return all.filter(s => s.dueAt.slice(0,10) === iso && !s.done);
}

// Mark entry done and optionally schedule next repetition (simple)
export async function markDone(entryId, score=5) {
  const e = await db.schedule_entries.get(entryId);
  if (!e) return null;
  await db.schedule_entries.update(entryId, { done: true, score });
  return true;
}
