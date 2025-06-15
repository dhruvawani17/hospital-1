"use client";

import { SERVICES_DATA, APP_NAME } from '@/lib/constants';
import { ServiceItemCard } from './ServiceItemCard';
import { Input } from "@/components/ui/input";
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export function ServiceCatalogClient() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = useMemo(() => {
    if (!searchTerm) return SERVICES_DATA;
    return SERVICES_DATA.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl">Our Medical Services</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Explore a wide range of specialized medical services offered at {APP_NAME}.
        </p>
      </div>

      <div className="mb-8 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for services (e.g., Cardiology, Check-up)"
          className="w-full pl-10 pr-4 py-3 rounded-lg text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search services"
        />
      </div>

      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service, index) => (
             <div key={service.id} className="animate-slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <ServiceItemCard service={service} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-headline font-semibold mb-2">No Services Found</h2>
          <p className="text-muted-foreground">
            Your search for "{searchTerm}" did not match any services. Try a different keyword or browse all services.
          </p>
        </div>
      )}
    </div>
  );
}
