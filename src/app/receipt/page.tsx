import { ReceiptClient } from "@/components/appointments/ReceiptClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Appointment Receipt",
  description: "View your appointment confirmation and receipt.",
};

// Helper component for Suspense boundary
function ReceiptPageContent() {
  return <ReceiptClient />;
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="container flex justify-center items-center min-h-screen"><p>Loading receipt...</p></div>}>
      <ReceiptPageContent />
    </Suspense>
  );
}
