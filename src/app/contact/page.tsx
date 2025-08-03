import ContactClient from '@/components/contact/ContactClient';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our healthcare facility. Find our location, contact information, and send us a message.",
};

export default function ContactPage() {
  return <ContactClient />;
}
