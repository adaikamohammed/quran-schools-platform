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
let onlineHandler: (() => void) | null = null; // لإزالة listener عند الإيقاف

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
      credentials: 'include',
      body: JSON.stringify({ operations: pendingItems }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("[SyncEngine] Push sync skipped: User is not authenticated (401).");
        isCurrentlySyncing = false;
        return;
      }
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
  // لا تحاول المزامنة عند عدم وجود الاتصال
  if (!navigator.onLine) return;

  const status = getCurrentSyncStatus();
  const lastSyncAt = status.lastSyncAt || "1970-01-01T00:00:00.000Z";

  try {
    const res = await fetch(`/api/sync/pull?lastSyncAt=${encodeURIComponent(lastSyncAt)}`, {
      method: "GET",
      credentials: "include",
    });

    // جلسة منتهية أو غير مصرح — تجاهل بصمت
    if (res.status === 401 || res.status === 403) return;

    if (!res.ok) {
      console.warn(`[SyncEngine] Pull sync returned ${res.status}`);
      return;
    }

    const data = await res.json();
    if (!data.changes || data.changes.length === 0) return;

    const db = getDB();

    // Applying pulled changes individually (no transaction to avoid table-scope issues)
    for (const change of data.changes) {
      try {
        const table = db[change.table as keyof typeof db] as any;
        if (!table || typeof table.put !== "function") continue;

        if (change.deletedAt) {
          await table.delete(change.recordId);
        } else {
          await table.put(change.data);
        }
      } catch (tableErr) {
        console.warn(`[PullSync] Could not save change for table "${change.table}":`, tableErr);
      }
    }

    notify({ lastSyncAt: new Date().toISOString() });
  } catch {
    // فشل الشبكة — تجاهل بصمت (offline / cors)
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

  // مزامنة عند العودة للإنترنت — named function لإزالتها لاحقاً
  onlineHandler = () => {
    performSync();
    pullSync();
  };
  window.addEventListener('online', onlineHandler);

  console.log('[SyncEngine] بدأ محرك المزامنة — يعمل كل 5 دقائق');
}

export function stopSyncEngine(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  // إزالة event listener بشكل صحيح
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }
  console.log('[SyncEngine] توقّف محرك المزامنة');
}

// ─── مزامنة فورية (يدوية) ────────────────────────────────

export async function syncNow(): Promise<void> {
  await performSync();
  await pullSync();
}

// ─── إحصائيات المزامنة ───────────────────────────────────

export function getCurrentSyncStatus(): SyncStatus {
  return syncStatus;
}
