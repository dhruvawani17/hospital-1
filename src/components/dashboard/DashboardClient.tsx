"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointment } from '@/contexts/AppointmentContext';
import type { Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays, Clock, BriefcaseMedical, User, ListChecks, PlusCircle } from 'lucide-react';
import Image from 'next/image';

export function DashboardClient() {
  const { user } = useAuth();
  const { confirmedAppointments } = useAppointment();

  // Filter appointments for the current user (mock: all appointments are for the current user)
  // In a real app, appointments would be fetched for the logged-in user.
  const userAppointments = confirmedAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!user) {
    // This should ideally be handled by ProtectedRoute, but as a fallback:
    return <p>Please log in to view your dashboard.</p>;
  }

  return (
    <div className="container py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Welcome, {user.displayName || 'User'}!</h1>
        <p className="mt-2 text-lg text-muted-foreground">Manage your appointments and view your health journey with us.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><ListChecks className="mr-3 h-7 w-7 text-primary" />Your Appointments</CardTitle>
            <CardDescription>View and manage your scheduled appointments.</CardDescription>
          </div>
           <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/book-appointment">
              <PlusCircle className="mr-2 h-4 w-4" /> New Appointment
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {userAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Image src="https://placehold.co/300x200.png" alt="No appointments" width={300} height={200} className="mx-auto mb-6 rounded-lg" data-ai-hint="empty calendar"/>
              <h3 className="text-xl font-semibold mb-2">No Appointments Yet</h3>
              <p className="text-muted-foreground mb-6">You haven't scheduled any appointments. Book one today!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userAppointments.map((appt) => (
                <Card key={appt.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center gap-2">
                      <BriefcaseMedical className="h-6 w-6 text-primary" />
                      {appt.serviceName}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      Status: <span className={appt.status === 'confirmed' ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>{appt.status}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <CalendarDays className="h-5 w-5 text-muted-foreground mr-2" />
                      <strong>Date:</strong>&nbsp;{format(new Date(appt.date), 'PPP')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                      <strong>Time:</strong>&nbsp;{appt.time}
                    </div>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-muted-foreground mr-2" />
                      <strong>Patient:</strong>&nbsp;{appt.patientName}
                    </div>
                    <div className="flex items-center">
                       <span className="text-primary font-semibold">ID:</span>&nbsp;{appt.id.substring(0,10)}...
                    </div>
                  </CardContent>
                  {/* Add actions like "View Details" or "Cancel" if needed */}
                   <div className="p-6 pt-0">
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/receipt?transactionId=${appt.id}`}>View Receipt</Link>
                     </Button>
                   </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
