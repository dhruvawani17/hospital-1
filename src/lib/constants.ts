
import type { Service } from '@/types';
import { Stethoscope, HeartPulse, Activity, ShieldCheck, Eye, Baby, Award, BriefcaseMedical as BriefcaseIcon } from 'lucide-react'; // Renamed to avoid conflict

export const APP_NAME = "HealthFirst Connect";

export const SERVICES_DATA: Service[] = [
  {
    id: 'general-consultation',
    name: 'General Consultation',
    description: 'Comprehensive health check-ups and consultations with experienced general practitioners.',
    icon: Stethoscope,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'doctor patient',
    price: 4000,
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Specialized heart care including diagnostics, treatment, and prevention of cardiovascular diseases.',
    icon: HeartPulse,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'heart health',
    price: 12000,
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    description: 'Rehabilitation services to help restore movement and function after injury or illness.',
    icon: Activity,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'physical therapy',
    price: 6000,
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Expert care for skin, hair, and nail conditions, including cosmetic dermatology.',
    icon: ShieldCheck,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'skin care',
    price: 8000,
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    description: 'Comprehensive eye care services, from routine exams to advanced surgical procedures.',
    icon: Eye,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'eye exam',
    price: 9600,
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    description: 'Dedicated healthcare for infants, children, and adolescents, ensuring their healthy development.',
    icon: Baby,
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'child doctor',
    price: 4800,
  },
];

export const DOCTOR_AVAILABILITY_STRING = "Available Monday to Friday from 9:00 AM to 5:00 PM. Lunch break from 12:00 PM to 1:00 PM. Limited slots on Saturday from 10:00 AM to 2:00 PM for urgent cases only.";

export const MOCK_TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

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

export const DOCTORS_DATA: Doctor[] = [
  {
    id: 'dr-emily-carter',
    name: 'Dr. Emily Carter',
    specialty: 'General Physician',
    qualifications: 'MD, FACP',
    experience: '12+ years of practice',
    image: 'https://placehold.co/400x400.png',
    dataAiHint: 'doctor portrait',
    specialtyIcon: Stethoscope,
  },
  {
    id: 'dr-benjamin-lee',
    name: 'Dr. Benjamin Lee',
    specialty: 'Cardiologist',
    qualifications: 'MD, FACC, PhD',
    experience: '15+ years in heart care',
    image: 'https://placehold.co/400x400.png',
    dataAiHint: 'doctor portrait',
    specialtyIcon: HeartPulse,
  },
  {
    id: 'dr-olivia-davis',
    name: 'Dr. Olivia Davis',
    specialty: 'Pediatrician',
    qualifications: 'MD, FAAP',
    experience: '8+ years with children',
    image: 'https://placehold.co/400x400.png',
    dataAiHint: 'doctor portrait',
    specialtyIcon: Baby,
  },
  {
    id: 'dr-marcus-chen',
    name: 'Dr. Marcus Chen',
    specialty: 'Dermatologist',
    qualifications: 'MD, FAAD',
    experience: '10+ years in skin health',
    image: 'https://placehold.co/400x400.png',
    dataAiHint: 'doctor portrait',
    specialtyIcon: ShieldCheck,
  },
  {
    id: 'dr-sophia-miller',
    name: 'Dr. Sophia Miller',
    specialty: 'Orthopedic Surgeon',
    qualifications: 'MD, FRCS',
    experience: '7+ years in orthopedics',
    image: 'https://placehold.co/400x400.png',
    dataAiHint: 'doctor portrait',
    specialtyIcon: Activity, // Using Activity as a proxy for orthopedics/movement
  },
  {
    id: 'dr-david-wilson',
    name: 'Dr. David Wilson',
    specialty: 'Neurologist',
    qualifications: 'MD, PhD, FAAN',
    experience: '18+ years in neurological care',
    image: 'https://placehold.co/400x400.png',
    dataAiHint: 'neurologist portrait', // Made hint more specific
    // No direct icon for neurologist, can omit or use a generic one if needed
  },
];

