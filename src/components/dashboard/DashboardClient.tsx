
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointment } from '@/contexts/AppointmentContext';
import type { Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays, Clock, BriefcaseMedical, User, ListChecks, PlusCircle, XCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
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
  const { confirmedAppointments, cancelAppointment, isLoadingAppointments } = useAppointment();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filter out cancelled appointments and sort by date
  const userAppointments = confirmedAppointments
    .filter(appt => appt.status !== 'cancelled') // Filter out cancelled appointments
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending

  console.log("[DashboardClient] Rendering. User:", user);
  console.log("[DashboardClient] isLoadingAppointments:", isLoadingAppointments);
  console.log("[DashboardClient] All appointments from context:", confirmedAppointments);
  console.log("[DashboardClient] Filtered userAppointments:", userAppointments);


  if (!user) {
    // This case should ideally be handled by ProtectedRoute, but good to have a fallback.
    return (
      <div className="container py-12 md:py-16 text-center">
        <p>Please log in to view your dashboard.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
      </div>
    );
  }

  const handleCancelAppointment = async (appointmentId: string) => { // appointmentId is Firestore doc ID
    setCancellingId(appointmentId);
    try {
      console.log("[DashboardClient] Starting cancellation for appointment:", appointmentId);
      await cancelAppointment(appointmentId);
      console.log("[DashboardClient] Cancellation completed successfully");
      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been successfully cancelled and removed.",
      });
    } catch (error) {
      console.error("[DashboardClient] Cancellation error:", error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: "Could not cancel the appointment. Please try again.",
      });
    } finally {
      setCancellingId(null);
    }
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

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending Payment';
      default:
        return status;
    }
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Welcome, {user.displayName || 'User'}!</h1>
        <p className="mt-2 text-lg text-muted-foreground">Manage your appointments and view your health journey with us.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><ListChecks className="mr-3 h-7 w-7 text-primary" />Your Appointments</CardTitle>
            <CardDescription>View and manage your scheduled appointments.</CardDescription>
          </div>
           <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
            <Link href="/book-appointment">
              <PlusCircle className="mr-2 h-4 w-4" /> New Appointment
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingAppointments ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading appointments...</p>
            </div>
          ) : userAppointments.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Appointments Yet</h3>
              <p className="text-muted-foreground mb-6">You haven't scheduled any appointments. Book one today!</p>
              {user?.uid && <p className="text-xs text-muted-foreground">Querying for user ID: {user.uid}</p>}
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
                      Status: <span className={getStatusClass(appt.status)}>{getStatusText(appt.status)}</span>
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
                       <Info className="h-5 w-5 text-muted-foreground mr-2" />
                       <strong>Receipt ID:</strong>&nbsp;<span className="truncate">{appt.transactionId || 'Pending Payment'}</span>
                    </div>
                  </CardContent>
                   <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                     {appt.transactionId ? (
                       <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                         <Link href={`/receipt?transactionId=${appt.transactionId}`}>View Receipt</Link>
                       </Button>
                     ) : (
                       <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                         <Link href="/payment">Complete Payment</Link>
                       </Button>
                     )}
                     {(appt.status === 'confirmed' || appt.status === 'pending') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full sm:w-auto"
                            disabled={cancellingId === appt.id}
                          >
                            {cancellingId === appt.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Appointment
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Confirm Cancellation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your appointment for {appt.serviceName} on {format(new Date(appt.date), 'PPP')} at {appt.time}? This action will permanently delete the appointment and make the time slot available for others to book. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleCancelAppointment(appt.id)} 
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={cancellingId === appt.id}
                            >
                              {cancellingId === appt.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
                                </>
                              ) : (
                                "Yes, Cancel Appointment"
                              )}
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
