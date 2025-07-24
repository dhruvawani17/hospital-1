
import type React from 'react';
import type { Timestamp } from 'firebase/firestore';

export interface Service {
  id: string;
  name: string;
  description: string;
  nameKey?: string;
  descriptionKey?: string;
  icon?: React.ElementType;
  image: string;
  price: number;
  dataAiHint?: string;
}

export interface AppointmentFormData {
  serviceId: string;
  date: Date; // Stays as Date for form handling, converted to Timestamp for Firestore
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
}

export interface Appointment {
  id: string; // Firestore document ID
  userId: string;
  serviceId: string;
  serviceName: string;
  date: Date; // Converted from Firestore Timestamp on fetch
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: number;
  transactionId: string; // Original transaction/receipt ID
  createdAt: Date; // Converted from Firestore Timestamp
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  contactNumber?: string | null;
  photoURL?: string | null;
  dataAiHint?: string;
}

export interface ReceiptData extends Omit<Appointment, 'date' | 'createdAt'> {
  paymentDate: Date; // Converted from Firestore Timestamp
  date: Date; // Appointment date
  createdAt: Date; // Appointment creation date
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

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId?: string;
  doctorName?: string;
  visitDate: Date;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medications: Medication[];
  vitals: Vitals;
  notes?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Vitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface MedicalRecordFormData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  visitDate: Date;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medications: Medication[];
  vitals: Vitals;
  notes?: string;
  followUpDate?: Date;
}
