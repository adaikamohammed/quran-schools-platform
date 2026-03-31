// ============================================================
// محرك المزامنة — يرفع البيانات المحلية إلى Supabase كل 5 دقائق
// ============================================================

import { getPendingSyncItems, updateSyncStatus, getDB } from './db';
import type { SyncQueueItem } from '../types';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 دقائق بالميلي ثانية
const MAX_RETRIES = 5;

export type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncStatus {
  state: SyncState;
  lastSyncAt: string | null;
  pendingCount: number;
  errorMessage?: string;
}

// المستمعون لحالة المزامنة
type SyncListener = (status: SyncStatus) => void;
const listeners: Set<SyncListener> = new Set();

let syncStatus: SyncStatus = {
  state: 'idle',
  lastSyncAt: null,
  pendingCount: 0,
};

let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let isCurrentlySyncing = false;

// ─── الاشتراك في تحديثات الحالة ──────────────────────────

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(syncStatus); // إرسال الحالة الحالية فوراً
  return () => listeners.delete(listener);
}

function notify(newStatus: Partial<SyncStatus>): void {
  syncStatus = { ...syncStatus, ...newStatus };
  listeners.forEach((l) => l(syncStatus));
}

// ─── حساب العناصر المعلّقة ────────────────────────────────

async function updatePendingCount(): Promise<void> {
  const items = await getPendingSyncItems();
  notify({ pendingCount: items.length });
}

// ─── المزامنة الرئيسية ───────────────────────────────────

async function performSync(): Promise<void> {
  if (isCurrentlySyncing) return;

  // التحقق من الاتصال بالإنترنت
  if (!navigator.onLine) {
    notify({ state: 'offline', pendingCount: (await getPendingSyncItems()).length });
    return;
  }

  const pendingItems = await getPendingSyncItems();
  if (pendingItems.length === 0) {
    notify({ state: 'success', lastSyncAt: new Date().toISOString() });
    return;
  }

  isCurrentlySyncing = true;
  notify({ state: 'syncing', pendingCount: pendingItems.length });

  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: pendingItems }),
    });

    if (!res.ok) {
      throw new Error(`Sync failed with status: ${res.status}`);
    }

    // Mark all as synced
    const db = getDB();
    await db.transaction('rw', db.syncQueue, async () => {
      for (const item of pendingItems) {
        await updateSyncStatus(item.id, 'synced');
      }
    });

    notify({ state: 'success', lastSyncAt: new Date().toISOString(), pendingCount: 0 });
  } catch (err: any) {
    console.error('Batch sync failed:', err);
    
    // Increment retries
    const db = getDB();
    await db.transaction('rw', db.syncQueue, async () => {
      for (const item of pendingItems) {
        const newRetries = item.retries + 1;
        if (newRetries >= MAX_RETRIES) {
          await updateSyncStatus(item.id, 'failed', err.message);
        } else {
          await db.syncQueue.update(item.id, {
            retries: newRetries,
            error: err.message,
          });
        }
      }
    });

    const remaining = await getPendingSyncItems();
    notify({
      state: 'error',
      lastSyncAt: new Date().toISOString(),
      pendingCount: remaining.length,
      errorMessage: 'فشل رفع البيانات. سيتم إعادة المحاولة.',
    });
  } finally {
    isCurrentlySyncing = false;
  }
}

// ─── منطق سحب البيانات (Pull) من السحابة ─────────────────

export async function pullSync(): Promise<void> {
  const status = getCurrentSyncStatus();
  const lastSyncAt = status.lastSyncAt || "1970-01-01T00:00:00.000Z";

  try {
    const res = await fetch(`/api/sync/pull?lastSyncAt=${encodeURIComponent(lastSyncAt)}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Pull sync failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.changes || data.changes.length === 0) return;

    const db = getDB();
    
    // Applying pulled changes correctly
    await db.transaction("rw", db.students, db.sessions, db.users, async () => {
      for (const change of data.changes) {
        const table = db[change.table as keyof typeof db] as any;
        if (!table) continue;

        if (change.deletedAt) {
          // It's a soft delete, remove it locally
          await table.delete(change.recordId);
        } else {
          // Upsert the record locally
          await table.put(change.data);
        }
      }
    });

    notify({ lastSyncAt: new Date().toISOString() });
  } catch (err) {
    console.error("Delta pull failed:", err);
  }
}

// ─── تشغيل وإيقاف محرك المزامنة ─────────────────────────

export function startSyncEngine(): void {
  if (syncIntervalId) return; // مشغّل بالفعل

  // مزامنة فورية عند البداية
  updatePendingCount().then(() => performSync());
  pullSync();

  // مزامنة دورية كل 5 دقائق
  syncIntervalId = setInterval(() => {
    performSync();
    pullSync();
  }, SYNC_INTERVAL);

  // مزامنة عند العودة للإنترنت
  window.addEventListener('online', () => {
    performSync();
    pullSync();
  });

  console.log('[SyncEngine] بدأ محرك المزامنة — يعمل كل 5 دقائق');
}

export function stopSyncEngine(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  // Remove event listener (requires named function if we want to remove it properly, but for demo we can ignore or recreate)
  console.log('[SyncEngine] توقّف محرك المزامنة');
}

// ─── مزامنة فورية (يدوية) ────────────────────────────────

export async function syncNow(): Promise<void> {
  await performSync();
}

// ─── إحصائيات المزامنة ───────────────────────────────────

export function getCurrentSyncStatus(): SyncStatus {
  return syncStatus;
}
