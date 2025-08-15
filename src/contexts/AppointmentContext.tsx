
"use client";

import type { Appointment, AppointmentFormData, ReceiptData, Service } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SERVICES_DATA, APP_NAME, DOCTORS_DATA } from "@/lib/constants";
import { confirmAndReleaseSlot, freeUpSlot, createPendingAppointment, updateAppointmentToConfirmed } from "@/lib/appointments";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sendConfirmationEmail, type SendConfirmationEmailInput, type SendConfirmationEmailOutput } from "@/ai/flows/send-confirmation-email-flow";


interface AppointmentContextType {
  currentAppointment: Partial<AppointmentFormData> | null;
  confirmedAppointments: Appointment[];
  isLoadingAppointments: boolean;
  startNewAppointment: (service: Service) => void;
  updateAppointmentData: (data: Partial<AppointmentFormData>) => void;
  createPendingAppointmentOnPayment: (appointmentData?: Partial<AppointmentFormData>) => Promise<string | null>;
  confirmAppointment: (paymentDetails: { transactionId: string }) => Promise<ReceiptData | null>;
  getAppointmentByTransactionId: (transactionId: string) => Promise<Appointment | null>;
  clearCurrentAppointment: () => void;
  cancelAppointment: (appointmentId: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

async function triggerEmailFlow(receipt: ReceiptData, toast: ReturnType<typeof useToast>['toast']): Promise<void> {
  console.log(`[AppointmentContext/triggerEmailFlow] Preparing to call sendConfirmationEmail Genkit flow for: ${receipt.patientEmail}`);

  const emailInput: SendConfirmationEmailInput = {
    toEmail: receipt.patientEmail,
    patientName: receipt.patientName,
    serviceName: receipt.serviceName,
    appointmentDate: receipt.date.toISOString().split('T')[0],
    appointmentTime: receipt.time,
    transactionId: receipt.transactionId,
    price: receipt.price,
    receiptUrl: `${window.location.origin}/receipt?transactionId=${receipt.transactionId}`,
  };

  try {
    console.log('[AppointmentContext/triggerEmailFlow] Calling sendConfirmationEmail flow with input:', JSON.stringify(emailInput));
    const emailResult: SendConfirmationEmailOutput = await sendConfirmationEmail(emailInput);
    console.log('[AppointmentContext/triggerEmailFlow] Result from sendConfirmationEmail flow:', JSON.stringify(emailResult));

    if (emailResult.success) {
      toast({
        title: "Email Processed",
        description: emailResult.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Email Sending Issue",
        description: emailResult.message,
      });
    }
  } catch (error: any) {
    console.error("[AppointmentContext/triggerEmailFlow] Error calling sendConfirmationEmail flow:", error);
    toast({
      variant: "destructive",
      title: "Email Flow Error",
      description: `Could not process email request: ${error.message || 'Unknown error'}`,
    });
  }
}


export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentAppointment, setCurrentAppointment] = useState<Partial<AppointmentFormData> | null>(null);
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [bookingClientId, setBookingClientId] = useState<string>('');

  // Initialize stable booking client id on mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const k = 'bookingClientId';
      let id = localStorage.getItem(k);
      if (!id) {
        id = `client-${Math.random().toString(36).slice(2)}-${Date.now()}`;
        localStorage.setItem(k, id);
      }
      setBookingClientId(id);
    }
  }, []);

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
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
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
    if (!user?.uid || !currentAppointment || !currentAppointment.serviceId || !currentAppointment.doctorId || !currentAppointment.date || !currentAppointment.time || !currentAppointment.patientName || !currentAppointment.patientEmail) {
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

    // Resolve doctor name
    const doctor = DOCTORS_DATA.find(d => d.id === currentAppointment.doctorId);
    if (!doctor) {
      toast({ variant: "destructive", title: "Doctor Not Found", description: `Doctor with ID ${currentAppointment.doctorId} not found.` });
      return null;
    }

    // Confirm slot lock and mark as booked to prevent double booking
    const dateObj = new Date(currentAppointment.date);
    const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const lockResult = await confirmAndReleaseSlot({
      serviceId: currentAppointment.serviceId,
      doctorId: currentAppointment.doctorId,
      date: dateKey,
      time: currentAppointment.time,
      userId: user.uid, // Use authenticated user ID for final confirmation
      patientName: currentAppointment.patientName,
      patientEmail: currentAppointment.patientEmail,
      patientPhone: currentAppointment.patientPhone || '',
      transactionId: paymentDetails.transactionId,
    });
    if (!lockResult.ok) {
      toast({ variant: 'destructive', title: 'Slot No Longer Available', description: 'Please go back and pick another time.' });
      return null;
    }

    const newAppointmentDataToSave = {
      userId: user.uid,
      serviceId: currentAppointment.serviceId,
      serviceName: service.name,
      doctorId: currentAppointment.doctorId,
      doctorName: doctor.name,
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

      const receiptData: ReceiptData = {
        id: docRef.id,
        userId: user.uid,
        serviceId: newAppointmentDataToSave.serviceId,
        serviceName: newAppointmentDataToSave.serviceName,
        doctorId: newAppointmentDataToSave.doctorId,
        doctorName: newAppointmentDataToSave.doctorName,
        date: new Date(currentAppointment.date),
        time: newAppointmentDataToSave.time,
        patientName: newAppointmentDataToSave.patientName,
        patientEmail: newAppointmentDataToSave.patientEmail,
        patientPhone: newAppointmentDataToSave.patientPhone,
        status: newAppointmentDataToSave.status,
        price: newAppointmentDataToSave.price,
        transactionId: newAppointmentDataToSave.transactionId,
        createdAt: new Date(),
        paymentDate: new Date(newAppointmentDataToSave.paymentDate.toDate()),
      };

      await fetchAppointments(user.uid);
      await triggerEmailFlow(receiptData, toast);

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

  const createPendingAppointmentOnPayment = useCallback(async (appointmentData?: Partial<AppointmentFormData>): Promise<string | null> => {
    // Use provided data or fall back to current appointment
    const dataToUse = appointmentData || currentAppointment;
    
    if (!user?.uid || !dataToUse || !dataToUse.serviceId || !dataToUse.doctorId || !dataToUse.date || !dataToUse.time || !dataToUse.patientName || !dataToUse.patientEmail) {
      console.error("[AppointmentContext] Incomplete appointment data or user not logged in for createPendingAppointmentOnPayment. Data to use:", dataToUse, "User:", user);
      toast({
        variant: "destructive",
        title: "Booking Error",
        description: "Missing required information or user not logged in to create appointment.",
      });
      return null;
    }

    const service = SERVICES_DATA.find(s => s.id === dataToUse.serviceId);
    if (!service) {
      console.error("[AppointmentContext] Service not found for pending appointment. Service ID:", dataToUse.serviceId);
      toast({
        variant: "destructive",
        title: "Booking Error",
        description: `Service with ID ${dataToUse.serviceId} not found.`,
      });
      return null;
    }

    const doctor = DOCTORS_DATA.find(d => d.id === dataToUse.doctorId);
    if (!doctor) {
      toast({ variant: "destructive", title: "Doctor Not Found", description: `Doctor with ID ${dataToUse.doctorId} not found.` });
      return null;
    }

    try {
      const result = await createPendingAppointment({
        userId: user.uid,
        serviceId: dataToUse.serviceId,
        serviceName: service.name,
        doctorId: dataToUse.doctorId,
        doctorName: doctor.name,
        date: new Date(dataToUse.date),
        time: dataToUse.time,
        patientName: dataToUse.patientName,
        patientEmail: dataToUse.patientEmail,
        patientPhone: dataToUse.patientPhone || '',
        price: service.price,
      });

      if (result.ok && result.appointmentId) {
        console.log("[AppointmentContext] Pending appointment created successfully:", result.appointmentId);
        // Update context with the provided data if it was passed
        if (appointmentData) {
          updateAppointmentData(appointmentData);
        }
        return result.appointmentId;
      } else {
        console.error("[AppointmentContext] Failed to create pending appointment:", result.reason);
        toast({
          variant: "destructive",
          title: "Booking Error",
          description: "Could not create pending appointment. Please try again.",
        });
        return null;
      }
    } catch (error) {
      console.error("[AppointmentContext] Error creating pending appointment:", error);
      toast({
        variant: "destructive",
        title: "Booking Error",
        description: "Could not create pending appointment. Please try again.",
      });
      return null;
    }
  }, [user, currentAppointment, updateAppointmentData, toast]);

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
      console.log("[AppointmentContext] Starting cancellation for appointment ID:", appointmentId);
      
      // First, get the appointment details to extract slot information
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      
      if (!appointmentDoc.exists()) {
        console.error("[AppointmentContext] Appointment not found:", appointmentId);
        throw new Error("Appointment not found");
      }
      
      const appointmentData = appointmentDoc.data() as Appointment;
      console.log("[AppointmentContext] Appointment data to cancel:", appointmentData);
      
      // Format the date for slot deletion
      const appointmentDate = appointmentData.date instanceof Date 
        ? appointmentData.date 
        : (appointmentData.date as any)?.toDate?.() 
        ? (appointmentData.date as any).toDate() 
        : new Date(appointmentData.date);
      const dateKey = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;
      
      console.log("[AppointmentContext] Formatted date key for slot:", dateKey);
      
      // Free up the slot in the slot locks collection
      const freeSlotResult = await freeUpSlot({
        serviceId: appointmentData.serviceId,
        doctorId: appointmentData.doctorId,
        date: dateKey,
        time: appointmentData.time,
      });
      
      console.log("[AppointmentContext] Free slot result:", freeSlotResult);
      
      if (!freeSlotResult.ok) {
        console.warn("[AppointmentContext] Could not free slot, but proceeding with appointment deletion:", freeSlotResult.reason);
      }
      
      // Delete the appointment completely from the database
      console.log("[AppointmentContext] Deleting appointment document:", appointmentId);
      await deleteDoc(appointmentRef);
      console.log("[AppointmentContext] Appointment document deleted successfully");
      
      // Refresh the appointments list
      console.log("[AppointmentContext] Refreshing appointments list");
      await fetchAppointments(user.uid);
      
      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been successfully cancelled and the time slot is now available for others to book.",
      });
      
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
      createPendingAppointmentOnPayment,
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
