import { Metadata } from 'next';
import MedicalReportsClient from '@/components/medical-reports/MedicalReportsClient';

export const metadata: Metadata = {
  title: 'Medical Report Analysis | HealthFirst Connect',
  description: 'Upload and analyze your medical reports with AI-powered insights and Q&A functionality.',
};

export default function MedicalReportsPage() {
  return <MedicalReportsClient />;
}