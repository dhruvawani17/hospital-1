
"use client";

import type { Appointment, AppointmentFormData, ReceiptData, Service } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SERVICES_DATA, APP_NAME } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  Timestamp,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { useAuth } from "./AuthContext";

interface AppointmentContextType {
  currentAppointment: Partial<AppointmentFormData> | null;
  confirmedAppointments: Appointment[];
  isLoadingAppointments: boolean;
  startNewAppointment: (service: Service) => void;
  updateAppointmentData: (data: Partial<AppointmentFormData>) => void;
  confirmAppointment: (paymentDetails: { transactionId: string }) => Promise<ReceiptData | null>;
  getAppointmentByTransactionId: (transactionId: string) => Promise<Appointment | null>;
  clearCurrentAppointment: () => void;
  cancelAppointment: (appointmentId: string) => Promise<void>; // appointmentId is Firestore doc ID
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentAppointment, setCurrentAppointment] = useState<Partial<AppointmentFormData> | null>(null);
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  const fetchAppointments = useCallback(async (userId: string) => {
    setIsLoadingAppointments(true);
    try {
      const q = query(
        collection(db, "appointments"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      querySnapshot.forEach((docSnap) => { // Renamed doc to docSnap to avoid conflict with outer doc
        const data = docSnap.data();
        appointments.push({
          id: docSnap.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), 
        } as Appointment);
      });
      setConfirmedAppointments(appointments);
    } catch (error) {
      console.error("Error fetching appointments from Firestore:", error);
      setConfirmedAppointments([]); 
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []); // Empty dependency array is fine as it's called by useEffect with user.uid

  useEffect(() => {
    if (user?.uid) {
      fetchAppointments(user.uid);
    } else {
      setConfirmedAppointments([]); 
      setIsLoadingAppointments(false); // Ensure loading is false if no user
    }
  }, [user, fetchAppointments]);

  const startNewAppointment = useCallback((service: Service) => {
    setCurrentAppointment({ serviceId: service.id });
  }, []);

  const updateAppointmentData = useCallback((data: Partial<AppointmentFormData>) => {
    setCurrentAppointment(prev => ({ ...prev, ...data }));
  }, []);

  const confirmAppointment = useCallback(async (paymentDetails: { transactionId: string }): Promise<ReceiptData | null> => {
    if (!user?.uid || !currentAppointment || !currentAppointment.serviceId || !currentAppointment.date || !currentAppointment.time || !currentAppointment.patientName || !currentAppointment.patientEmail) {
      console.error("Incomplete appointment data or user not logged in for confirmAppointment");
      return null;
    }
    
    const service = SERVICES_DATA.find(s => s.id === currentAppointment.serviceId);
    if (!service) {
      console.error("Service not found for appointment confirmation");
      return null;
    }

    const newAppointmentDataToSave = {
      userId: user.uid,
      serviceId: currentAppointment.serviceId,
      serviceName: service.name,
      date: Timestamp.fromDate(new Date(currentAppointment.date)),
      time: currentAppointment.time,
      patientName: currentAppointment.patientName,
      patientEmail: currentAppointment.patientEmail,
      patientPhone: currentAppointment.patientPhone || '',
      status: 'confirmed' as Appointment['status'],
      price: service.price,
      transactionId: paymentDetails.transactionId,
      createdAt: serverTimestamp(),
      paymentDate: Timestamp.now() 
    };

    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, "appointments"), newAppointmentDataToSave);
      
      // Re-fetch appointments to update the local state with server-generated timestamp
      // This ensures data consistency.
      await fetchAppointments(user.uid);
      
      // Construct ReceiptData for immediate use by the receipt page
      // Use client-side dates for `date` and `createdAt` as they were just used.
      // `paymentDate` for receipt can also be client-side `new Date()`.
      const receiptData: ReceiptData = {
        id: docRef.id, // Use the new docRef.id
        userId: user.uid,
        serviceId: newAppointmentDataToSave.serviceId,
        serviceName: newAppointmentDataToSave.serviceName,
        date: new Date(currentAppointment.date), // Use original JS Date object
        time: newAppointmentDataToSave.time,
        patientName: newAppointmentDataToSave.patientName,
        patientEmail: newAppointmentDataToSave.patientEmail,
        patientPhone: newAppointmentDataToSave.patientPhone,
        status: newAppointmentDataToSave.status,
        price: newAppointmentDataToSave.price,
        transactionId: newAppointmentDataToSave.transactionId,
        createdAt: new Date(), // This is an approximation for the receipt, actual is serverTimestamp
        paymentDate: new Date(), // Use current client date for receipt object
      };
      return receiptData;
    } catch (error) {
      console.error("Error adding appointment to Firestore in confirmAppointment:", error);
      return null;
    }
  }, [user, currentAppointment, fetchAppointments]);

  const getAppointmentByTransactionId = useCallback(async (transactionId: string): Promise<Appointment | null> => {
    // User check can be optional here if transactionId is globally unique and secure
    try {
      const q = query(collection(db, "appointments"), where("transactionId", "==", transactionId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Appointment;
      }
      return null;
    } catch (error) {
      console.error("Error fetching appointment by transactionId from Firestore:", error);
      return null;
    }
  }, []); // Removed user?.uid dependency as it might not be strictly necessary if transactionId is unique


  const clearCurrentAppointment = useCallback(() => {
    setCurrentAppointment(null);
  }, []);

  const cancelAppointment = useCallback(async (appointmentId: string) => { 
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled'
      });
      // Optimistically update local state or re-fetch
      setConfirmedAppointments(prevAppointments =>
        prevAppointments.map(appt =>
          appt.id === appointmentId ? { ...appt, status: 'cancelled' } : appt
        )
      );
      // Optionally, you could call fetchAppointments(user.uid) here as well if strict consistency is needed
    } catch (error) {
      console.error("Error cancelling appointment in Firestore:", error);
      // Potentially re-throw or show error to user
    }
  }, []);

  return (
    <AppointmentContext.Provider value={{ 
      currentAppointment, 
      confirmedAppointments,
      isLoadingAppointments, 
      startNewAppointment, 
      updateAppointmentData, 
      confirmAppointment,
      getAppointmentByTransactionId,
      clearCurrentAppointment,
      cancelAppointment
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointment = (): AppointmentContextType => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error("useAppointment must be used within an AppointmentProvider");
  }
  return context;
};

