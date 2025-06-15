
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointment } from '@/contexts/AppointmentContext';
import type { Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays, Clock, BriefcaseMedical, User, ListChecks, PlusCircle, XCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

export function DashboardClient() {
  const { user } = useAuth();
  const { confirmedAppointments, cancelAppointment } = useAppointment();
  const { toast } = useToast();

  const userAppointments = confirmedAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!user) {
    return <p>Please log in to view your dashboard.</p>;
  }

  const handleCancelAppointment = (appointmentId: string) => {
    cancelAppointment(appointmentId);
    toast({
      title: "Appointment Cancelled",
      description: "The appointment has been successfully cancelled.",
    });
  };
  
  const getStatusClass = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 font-semibold';
      case 'cancelled':
        return 'text-red-600 font-semibold';
      case 'pending':
        return 'text-orange-500 font-semibold';
      default:
        return 'text-muted-foreground';
    }
  };


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
                <Card key={appt.id} className={cn("hover:shadow-md transition-shadow", appt.status === 'cancelled' && 'bg-muted/50 opacity-80')}>
                  <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center gap-2">
                      <BriefcaseMedical className="h-6 w-6 text-primary" />
                      {appt.serviceName}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      Status: <span className={getStatusClass(appt.status)}>{appt.status}</span>
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
                   <CardFooter className="flex justify-between items-center">
                     <Button variant="outline" size="sm" asChild>
                       <Link href={`/receipt?transactionId=${appt.id}`}>View Receipt</Link>
                     </Button>
                     {appt.status === 'confirmed' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Appointment
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Confirm Cancellation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your appointment for {appt.serviceName} on {format(new Date(appt.date), 'PPP')} at {appt.time}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelAppointment(appt.id)} className="bg-destructive hover:bg-destructive/90">
                              Yes, Cancel Appointment
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                     )}
                   </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
