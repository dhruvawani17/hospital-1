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
  deleteDoc,
  addDoc,
  updateDoc,
  Timestamp
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

export async function confirmAndReleaseSlot(params: { 
  serviceId: string; 
  doctorId: string; 
  date: string; 
  time: string; 
  userId: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  transactionId?: string;
}): Promise<{ ok: boolean; reason?: string; }> {
  const { serviceId, doctorId, date, time, userId, patientName, patientEmail, patientPhone, transactionId } = params;
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
      // On confirm, we keep the doc as historical and mark as booked with patient information
      tx.set(ref, { 
        booked: true,
        bookedAt: serverTimestamp(),
        patientName: patientName || '',
        patientEmail: patientEmail || '',
        patientPhone: patientPhone || '',
        transactionId: transactionId || '',
      }, { merge: true });
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

export async function freeUpSlot(params: { serviceId: string; doctorId: string; date: string; time: string; }): Promise<{ ok: boolean; reason?: string; }> {
  const { serviceId, doctorId, date, time } = params;
  const ref = doc(db, slotDocPath(serviceId, doctorId, date, time));
  
  console.log('[freeUpSlot] Attempting to free slot with params:', params);
  console.log('[freeUpSlot] Document path:', slotDocPath(serviceId, doctorId, date, time));
  
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      console.log('[freeUpSlot] Slot document exists:', snap.exists());
      if (snap.exists()) {
        console.log('[freeUpSlot] Deleting slot document');
        // Delete the slot lock document to free up the time slot
        tx.delete(ref);
      } else {
        console.log('[freeUpSlot] Slot document does not exist, nothing to delete');
      }
    });
    console.log('[freeUpSlot] Transaction completed successfully');
    return { ok: true };
  } catch (e: any) {
    console.error('[freeUpSlot] Error freeing slot:', e);
    return { ok: false, reason: 'Failed to free slot' };
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

export async function createPendingAppointment(appointmentData: {
  userId: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  date: Date;
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  price: number;
}): Promise<{ ok: boolean; appointmentId?: string; reason?: string; }> {
  try {
    const pendingAppointmentData = {
      ...appointmentData,
      date: Timestamp.fromDate(appointmentData.date),
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('[createPendingAppointment] Creating pending appointment:', pendingAppointmentData);
    const docRef = await addDoc(collection(db, "appointments"), pendingAppointmentData);
    console.log('[createPendingAppointment] Pending appointment created with ID:', docRef.id);
    
    return { ok: true, appointmentId: docRef.id };
  } catch (error) {
    console.error('[createPendingAppointment] Error creating pending appointment:', error);
    return { ok: false, reason: 'Failed to create pending appointment' };
  }
}

export async function updateAppointmentToConfirmed(appointmentId: string, transactionId: string): Promise<{ ok: boolean; reason?: string; }> {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, {
      status: 'confirmed',
      transactionId: transactionId,
      paymentDate: Timestamp.now(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('[updateAppointmentToConfirmed] Appointment updated to confirmed:', appointmentId);
    return { ok: true };
  } catch (error) {
    console.error('[updateAppointmentToConfirmed] Error updating appointment:', error);
    return { ok: false, reason: 'Failed to update appointment status' };
  }
}
