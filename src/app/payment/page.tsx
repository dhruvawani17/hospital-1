import { PaymentClient } from "@/components/appointments/PaymentClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your appointment booking by simulating payment.",
};

// Helper component for Suspense boundary
function PaymentPageContent() {
  return <PaymentClient />;
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="container flex justify-center items-center min-h-screen"><p>Loading payment details...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
