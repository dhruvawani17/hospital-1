"use client";

import type { Appointment, AppointmentFormData, ReceiptData, Service } from "@/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SERVICES_DATA } from "@/lib/constants";

interface AppointmentContextType {
  currentAppointment: Partial<AppointmentFormData> | null;
  confirmedAppointments: Appointment[];
  startNewAppointment: (service: Service) => void;
  updateAppointmentData: (data: Partial<AppointmentFormData>) => void;
  confirmAppointment: (paymentDetails: { transactionId: string }) => ReceiptData | null;
  getAppointmentById: (id: string) => Appointment | undefined;
  clearCurrentAppointment: () => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

const CONFIRMED_APPOINTMENTS_KEY = "healthfirst_confirmed_appointments";

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAppointment, setCurrentAppointment] = useState<Partial<AppointmentFormData> | null>(null);
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem(CONFIRMED_APPOINTMENTS_KEY);
      if (storedAppointments) {
        setConfirmedAppointments(JSON.parse(storedAppointments).map((appt: Appointment) => ({
          ...appt,
          date: new Date(appt.date) // Ensure date is a Date object
        })));
      }
    } catch (error) {
      console.error("Failed to load appointments from localStorage", error);
      localStorage.removeItem(CONFIRMED_APPOINTMENTS_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIRMED_APPOINTMENTS_KEY, JSON.stringify(confirmedAppointments));
    } catch (error) {
      console.error("Failed to save appointments to localStorage", error);
    }
  }, [confirmedAppointments]);

  const startNewAppointment = useCallback((service: Service) => {
    setCurrentAppointment({ serviceId: service.id });
  }, []);

  const updateAppointmentData = useCallback((data: Partial<AppointmentFormData>) => {
    setCurrentAppointment(prev => ({ ...prev, ...data }));
  }, []);

  const confirmAppointment = useCallback((paymentDetails: { transactionId: string }): ReceiptData | null => {
    if (!currentAppointment || !currentAppointment.serviceId || !currentAppointment.date || !currentAppointment.time || !currentAppointment.patientName || !currentAppointment.patientEmail) {
      console.error("Incomplete appointment data");
      return null;
    }
    
    const service = SERVICES_DATA.find(s => s.id === currentAppointment.serviceId);
    if (!service) {
      console.error("Service not found for appointment");
      return null;
    }

    const newAppointment: Appointment = {
      id: paymentDetails.transactionId, // Use transactionId as appointment ID for simplicity
      serviceId: currentAppointment.serviceId,
      serviceName: service.name,
      date: new Date(currentAppointment.date), // Ensure it's a Date object
      time: currentAppointment.time,
      patientName: currentAppointment.patientName,
      patientEmail: currentAppointment.patientEmail,
      patientPhone: currentAppointment.patientPhone || '',
      status: 'confirmed',
      price: service.price,
      patientPreferences: currentAppointment.patientPreferences
    };

    setConfirmedAppointments(prev => [...prev, newAppointment]);
    const receiptData: ReceiptData = {
      ...newAppointment,
      transactionId: paymentDetails.transactionId,
      paymentDate: new Date(),
    };
    
    // Do not clear currentAppointment here, receipt page might need it. Clear explicitly.
    return receiptData;
  }, [currentAppointment]);

  const getAppointmentById = useCallback((id: string) => {
    return confirmedAppointments.find(appt => appt.id === id);
  }, [confirmedAppointments]);

  const clearCurrentAppointment = useCallback(() => {
    setCurrentAppointment(null);
  }, []);

  return (
    <AppointmentContext.Provider value={{ 
      currentAppointment, 
      confirmedAppointments, 
      startNewAppointment, 
      updateAppointmentData, 
      confirmAppointment,
      getAppointmentById,
      clearCurrentAppointment
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
