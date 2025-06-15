import { ServiceCatalogClient } from "@/components/services/ServiceCatalogClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Services",
  description: "Explore the wide range of medical services offered at HealthFirst Connect.",
};

export default function ServicesPage() {
  return <ServiceCatalogClient />;
}
