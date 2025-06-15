
import type React from 'react';

export interface Service {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType;
  image: string; 
  price: number;
  dataAiHint?: string;
}

export interface AppointmentFormData {
  serviceId: string;
  date: Date;
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  // patientPreferences?: string; // Removed
}

export interface Appointment extends AppointmentFormData {
  id: string;
  serviceName: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: number;
  // patientPreferences?: string; // Removed
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

export interface ReceiptData extends Appointment {
  transactionId: string;
  paymentDate: Date;
  // patientPreferences?: string; // Removed
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experience: string;
  image: string;
  dataAiHint?: string;
  specialtyIcon?: React.ElementType;
}
