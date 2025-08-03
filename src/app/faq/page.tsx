import FAQClient from '@/components/faq/FAQClient';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about our healthcare services, appointments, and policies.",
};

export default function FAQPage() {
  return <FAQClient />;
}
