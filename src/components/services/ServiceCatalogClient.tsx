"use client";

import { SERVICES_DATA } from '@/lib/constants';
import { ServiceItemCard } from './ServiceItemCard';
import { Input } from "@/components/ui/input";
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function ServiceCatalogClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

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
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl">{t('ourMedicalServices')}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          {t('ourMedicalServicesDesc')}
        </p>
      </div>

      <div className="mb-8 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('searchServices')}
          className="w-full pl-10 pr-4 py-3 rounded-lg text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label={t('searchServicesLabel')}
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
          <h2 className="text-2xl font-headline font-semibold mb-2">{t('noServicesFound')}</h2>
          <p className="text-muted-foreground">
            {t('noServicesFoundDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
