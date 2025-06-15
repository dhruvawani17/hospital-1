
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
}

export interface Appointment extends AppointmentFormData {
  id: string;
  serviceName: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: number;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  contactNumber?: string | null; // Added contactNumber
  photoURL?: string | null;
  dataAiHint?: string;
}

export interface ReceiptData extends Appointment {
  transactionId: string;
  paymentDate: Date;
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

