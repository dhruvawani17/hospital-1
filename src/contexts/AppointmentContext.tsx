
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
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface AppointmentContextType {
  currentAppointment: Partial<AppointmentFormData> | null;
  confirmedAppointments: Appointment[];
  isLoadingAppointments: boolean;
  startNewAppointment: (service: Service) => void;
  updateAppointmentData: (data: Partial<AppointmentFormData>) => void;
  confirmAppointment: (paymentDetails: { transactionId: string }) => Promise<ReceiptData | null>;
  getAppointmentByTransactionId: (transactionId: string) => Promise<Appointment | null>;
  clearCurrentAppointment: () => void;
  cancelAppointment: (appointmentId: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Simulated email sending function
async function sendAppointmentConfirmationEmail(receipt: ReceiptData, toast: ReturnType<typeof useToast>['toast']): Promise<void> {
  console.log(`[AppointmentContext] Simulating sending appointment confirmation email to: ${receipt.patientEmail}`);
  console.log("[AppointmentContext] Email Details:", {
    serviceName: receipt.serviceName,
    date: receipt.date.toLocaleDateString(),
    time: receipt.time,
    patientName: receipt.patientName,
    transactionId: receipt.transactionId,
    price: receipt.price.toFixed(2),
  });

  // Simulate a short delay as if an API call was made
  await new Promise(resolve => setTimeout(resolve, 500));

  toast({
    title: "Email Processed (Simulated)",
    description: `A confirmation for ${receipt.serviceName} would be sent to ${receipt.patientEmail}.`,
  });
}


export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentAppointment, setCurrentAppointment] = useState<Partial<AppointmentFormData> | null>(null);
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  const fetchAppointments = useCallback(async (userId: string) => {
    console.log("[AppointmentContext] fetchAppointments called for userId:", userId);
    setIsLoadingAppointments(true);
    try {
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      console.log("[AppointmentContext] querySnapshot size:", querySnapshot.size);
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        appointments.push({
          id: docSnap.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), // Handle potentially missing createdAt during build
        } as Appointment);
      });
      console.log("[AppointmentContext] Fetched appointments array:", appointments);
      setConfirmedAppointments(appointments);
    } catch (error) {
      console.error("[AppointmentContext] Error fetching appointments from Firestore:", error);
      setConfirmedAppointments([]); 
      toast({ 
        variant: "destructive",
        title: "Error Loading Appointments",
        description: "Could not load your appointments. Please try again later.",
      });
    } finally {
      setIsLoadingAppointments(false);
      console.log("[AppointmentContext] fetchAppointments finished. isLoadingAppointments:", false);
    }
  }, [toast]); 

  useEffect(() => {
    console.log("[AppointmentContext] useEffect for user changed. User:", user);
    if (user?.uid) {
      fetchAppointments(user.uid);
    } else {
      setConfirmedAppointments([]);
      setIsLoadingAppointments(false); 
      console.log("[AppointmentContext] No user or user.uid, cleared appointments. isLoadingAppointments:", false);
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
      console.error("[AppointmentContext] Incomplete appointment data or user not logged in for confirmAppointment. Current appointment:", currentAppointment, "User:", user);
      toast({
        variant: "destructive",
        title: "Booking Error",
        description: "Missing required information or user not logged in to confirm booking.",
      });
      return null;
    }

    const service = SERVICES_DATA.find(s => s.id === currentAppointment.serviceId);
    if (!service) {
      console.error("[AppointmentContext] Service not found for appointment confirmation. Service ID:", currentAppointment.serviceId);
      toast({
        variant: "destructive",
        title: "Booking Error",
        description: `Service with ID ${currentAppointment.serviceId} not found.`,
      });
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
      console.log("[AppointmentContext] Attempting to add document to Firestore:", newAppointmentDataToSave);
      const docRef = await addDoc(collection(db, "appointments"), newAppointmentDataToSave);
      console.log("[AppointmentContext] Document added with ID:", docRef.id);
      
      // Construct receiptData using potentially fetched `createdAt` and `paymentDate` if needed,
      // or use client-side approximations if serverTimestamp takes time to resolve for immediate use.
      // For simplicity here, we'll use current client date for createdAt/paymentDate in receiptData if server values aren't immediately available.
      // The fetched appointments will have the accurate server timestamps.
      const receiptData: ReceiptData = {
        id: docRef.id,
        userId: user.uid,
        serviceId: newAppointmentDataToSave.serviceId,
        serviceName: newAppointmentDataToSave.serviceName,
        date: new Date(currentAppointment.date), 
        time: newAppointmentDataToSave.time,
        patientName: newAppointmentDataToSave.patientName,
        patientEmail: newAppointmentDataToSave.patientEmail,
        patientPhone: newAppointmentDataToSave.patientPhone,
        status: newAppointmentDataToSave.status,
        price: newAppointmentDataToSave.price,
        transactionId: newAppointmentDataToSave.transactionId,
        createdAt: new Date(), // Approximation, actual server timestamp in DB
        paymentDate: new Date(newAppointmentDataToSave.paymentDate.toDate()), // Convert Firestore Timestamp to JS Date
      };
      
      await fetchAppointments(user.uid); // Re-fetch all appointments to ensure consistency
      await sendAppointmentConfirmationEmail(receiptData, toast); // Call simulated email sending

      return receiptData;
    } catch (error) {
      console.error("[AppointmentContext] Error adding appointment to Firestore in confirmAppointment:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Could not save your appointment. Please try again.",
      });
      return null;
    }
  }, [user, currentAppointment, fetchAppointments, toast]);

  const getAppointmentByTransactionId = useCallback(async (transactionId: string): Promise<Appointment | null> => {
    if (!user?.uid) {
      console.error("[AppointmentContext] User not logged in. Cannot fetch appointment by transactionId.");
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to view this receipt.",
      });
      return null;
    }
    
    try {
      console.log(`[AppointmentContext] getAppointmentByTransactionId called for transactionId: ${transactionId}, userId: ${user.uid}`);
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
        where("transactionId", "==", transactionId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        console.log("[AppointmentContext] Found appointment for transactionId:", transactionId, data);
        return {
          id: docSnap.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Appointment;
      }
      console.log("[AppointmentContext] No appointment found for transactionId:", transactionId, "and userId:", user.uid);
      toast({ 
        variant: "default",
        title: "Receipt Not Found",
        description: "Could not find a receipt with that ID associated with your account.",
      });
      return null;
    } catch (error) {
      console.error("[AppointmentContext] Error fetching appointment by transactionId from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Receipt",
        description: "Could not load receipt details. Please try again later.",
      });
      return null;
    }
  }, [user, toast]);


  const clearCurrentAppointment = useCallback(() => {
    setCurrentAppointment(null);
  }, []);

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    if(!user?.uid) {
        console.error("[AppointmentContext] User not logged in, cannot cancel appointment.");
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to cancel an appointment.",
        });
        return;
    }
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled'
      });
      await fetchAppointments(user.uid);
    } catch (error) {
      console.error("[AppointmentContext] Error cancelling appointment in Firestore:", error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: "Could not cancel the appointment. Please try again.",
      });
    }
  }, [user, fetchAppointments, toast]);

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

