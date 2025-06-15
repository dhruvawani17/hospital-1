import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your appointments and view your health information.",
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardClient />
    </ProtectedRoute>
  );
}
