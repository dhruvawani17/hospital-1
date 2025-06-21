import { BookAppointmentClient } from "@/components/appointments/BookAppointmentClient";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Schedule your appointment with HealthFirst Connect. Use our smart scheduler for suggestions or book manually.",
};

export default function BookAppointmentPage() {
  return (
    <ProtectedRoute>
      <BookAppointmentClient />
    </ProtectedRoute>
  );
}
