// Firestore-based real-time slot locking utilities
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
} from 'firebase/firestore';

export type SlotLock = {
  serviceId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  lockedBy: string; // userId
  lockedAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
};

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function slotDocPath(serviceId: string, doctorId: string, date: string, time: string) {
  const key = `${serviceId}__${doctorId}__${date}__${time.replace(/[:\s]/g, '-')}`;
  return `slotLocks/${key}`;
}

export async function tryLockSlot(params: { serviceId: string; doctorId: string; date: string; time: string; userId: string; }): Promise<{ ok: boolean; reason?: string; }> {
  const { serviceId, doctorId, date, time, userId } = params;
  const ref = doc(db, slotDocPath(serviceId, doctorId, date, time));
  const now = Date.now();
  const expiresAtMs = now + LOCK_DURATION_MS;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        const data = snap.data() as any;
        const existingExpires = data.expiresAt?.toMillis?.() ?? 0;
        if (existingExpires > now && data.lockedBy !== userId) {
          throw new Error('locked');
        }
      }
      tx.set(ref, {
        serviceId, doctorId, date, time,
        lockedBy: userId,
        lockedAt: serverTimestamp(),
        expiresAt: new Date(expiresAtMs),
      }, { merge: true });
    });
    return { ok: true };
  } catch (e: any) {
    if (e.message === 'locked') return { ok: false, reason: 'Slot already locked' };
    return { ok: false, reason: 'Failed to lock slot' };
  }
}

export async function confirmAndReleaseSlot(params: { serviceId: string; doctorId: string; date: string; time: string; userId: string; }): Promise<{ ok: boolean; reason?: string; }> {
  const { serviceId, doctorId, date, time, userId } = params;
  const ref = doc(db, slotDocPath(serviceId, doctorId, date, time));
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('no-lock');
      const data = snap.data() as any;
      const now = Date.now();
      const expires = data.expiresAt?.toMillis?.() ?? 0;
      if (data.lockedBy !== userId) throw new Error('not-owner');
      if (expires < now) throw new Error('expired');
      // On confirm, we keep the doc as historical or delete to free slot forever.
      // To permanently book the slot, we can set a booked flag.
      tx.set(ref, { booked: true }, { merge: true });
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

export function subscribeToDayLocks(serviceId: string, doctorId: string, date: string, cb: (locks: Record<string, any>) => void) {
  const col = collection(db, 'slotLocks');
  const q = query(col, where('serviceId', '==', serviceId), where('doctorId', '==', doctorId), where('date', '==', date));
  return onSnapshot(q, (snap) => {
    const map: Record<string, any> = {};
    snap.forEach(doc => {
      map[doc.id] = doc.data();
    });
    cb(map);
  });
}
