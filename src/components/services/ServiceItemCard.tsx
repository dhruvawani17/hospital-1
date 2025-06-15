
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Service } from '@/types';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useRouter } from 'next/navigation';

interface ServiceItemCardProps {
  service: Service;
}

export function ServiceItemCard({ service }: ServiceItemCardProps) {
  const { startNewAppointment } = useAppointment();
  const router = useRouter();

  const handleBookNow = () => {
    startNewAppointment(service);
    router.push('/book-appointment');
  };

  return (
    <Card id={service.id} className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-56">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          data-ai-hint={service.dataAiHint || "medical service"}
        />
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          {service.icon && <service.icon className="h-7 w-7 text-primary" />}
          {service.name}
        </CardTitle>
        <CardDescription className="text-accent font-semibold">₹{service.price.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-4">{service.description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleBookNow} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
}
