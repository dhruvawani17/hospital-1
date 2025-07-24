import type { Metadata } from "next";
import MedicalRecordsClient from "@/components/medical-records/MedicalRecordsClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Medical Records - Hospital Management System",
  description: "View and manage your medical records",
};

export default function MedicalRecordsPage() {
  return (
    <ProtectedRoute>
      <MedicalRecordsClient />
    </ProtectedRoute>
  );
}