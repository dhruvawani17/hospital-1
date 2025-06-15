
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
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), // Fallback for older data
        } as Appointment);
      });
      setConfirmedAppointments(appointments);
    } catch (error) {
      console.error("Error fetching appointments from Firestore:", error);
      setConfirmedAppointments([]); // Reset on error
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchAppointments(user.uid);
    } else {
      setConfirmedAppointments([]); // Clear appointments if user logs out
      setIsLoadingAppointments(false);
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
      console.error("Incomplete appointment data or user not logged in");
      return null;
    }
    
    const service = SERVICES_DATA.find(s => s.id === currentAppointment.serviceId);
    if (!service) {
      console.error("Service not found for appointment");
      return null;
    }

    const newAppointmentData = {
      userId: user.uid,
      serviceId: currentAppointment.serviceId,
      serviceName: service.name,
      date: Timestamp.fromDate(new Date(currentAppointment.date)), // Convert JS Date to Firestore Timestamp
      time: currentAppointment.time,
      patientName: currentAppointment.patientName,
      patientEmail: currentAppointment.patientEmail,
      patientPhone: currentAppointment.patientPhone || '',
      status: 'confirmed' as Appointment['status'],
      price: service.price,
      transactionId: paymentDetails.transactionId,
      createdAt: serverTimestamp(), // Firestore server timestamp
      paymentDate: Timestamp.now() // For receipt
    };

    try {
      const docRef = await addDoc(collection(db, "appointments"), newAppointmentData);
      
      const confirmedAppt: Appointment = {
        id: docRef.id,
        userId: user.uid,
        serviceId: newAppointmentData.serviceId,
        serviceName: newAppointmentData.serviceName,
        date: currentAppointment.date, // Keep as JS Date in local state
        time: newAppointmentData.time,
        patientName: newAppointmentData.patientName,
        patientEmail: newAppointmentData.patientEmail,
        patientPhone: newAppointmentData.patientPhone,
        status: newAppointmentData.status,
        price: newAppointmentData.price,
        transactionId: newAppointmentData.transactionId,
        createdAt: new Date(), // Approximate, actual is serverTimestamp
      };
      
      setConfirmedAppointments(prev => [confirmedAppt, ...prev].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
      
      const receiptData: ReceiptData = {
        ...confirmedAppt,
        paymentDate: new Date(), // Use current client date for receipt object
      };
      return receiptData;
    } catch (error) {
      console.error("Error adding appointment to Firestore:", error);
      return null;
    }
  }, [user, currentAppointment]);

  const getAppointmentByTransactionId = useCallback(async (transactionId: string): Promise<Appointment | null> => {
    if (!user?.uid) { // Check if user is available for security, though transactionId might be globally unique
        console.warn("User not available for getAppointmentByTransactionId");
        // Decide if you want to allow fetching without user or restrict it
    }
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
  }, [user?.uid]);


  const clearCurrentAppointment = useCallback(() => {
    setCurrentAppointment(null);
  }, []);

  const cancelAppointment = useCallback(async (appointmentId: string) => { // appointmentId is Firestore doc ID
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled'
      });
      setConfirmedAppointments(prevAppointments =>
        prevAppointments.map(appt =>
          appt.id === appointmentId ? { ...appt, status: 'cancelled' } : appt
        )
      );
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
