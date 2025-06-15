import type { Service } from '@/types';
import { Stethoscope, HeartPulse, Activity, ShieldCheck, Eye, Baby } from 'lucide-react';

export const APP_NAME = "HealthFirst Connect";

export const SERVICES_DATA: Service[] = [
  {
    id: 'general-consultation',
    name: 'General Consultation',
    description: 'Comprehensive health check-ups and consultations with experienced general practitioners.',
    icon: Stethoscope,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'doctor patient',
    price: 50,
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Specialized heart care including diagnostics, treatment, and prevention of cardiovascular diseases.',
    icon: HeartPulse,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'heart health',
    price: 150,
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    description: 'Rehabilitation services to help restore movement and function after injury or illness.',
    icon: Activity,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'physical therapy',
    price: 75,
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Expert care for skin, hair, and nail conditions, including cosmetic dermatology.',
    icon: ShieldCheck, // Using ShieldCheck as a stand-in for skin/protection
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'skin care',
    price: 100,
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    description: 'Comprehensive eye care services, from routine exams to advanced surgical procedures.',
    icon: Eye,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'eye exam',
    price: 120,
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    description: 'Dedicated healthcare for infants, children, and adolescents, ensuring their healthy development.',
    icon: Baby,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'child doctor',
    price: 60,
  },
];

export const DOCTOR_AVAILABILITY_STRING = "Available Monday to Friday from 9:00 AM to 5:00 PM. Lunch break from 12:00 PM to 1:00 PM. Limited slots on Saturday from 10:00 AM to 2:00 PM for urgent cases only.";

export const MOCK_TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];
