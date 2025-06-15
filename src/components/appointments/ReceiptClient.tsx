"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppointment } from '@/contexts/AppointmentContext';
import type { ReceiptData } from '@/types';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthFirstLogo } from '@/components/shared/icons';
import { format } from 'date-fns';
import { CheckCircle, Printer, Share2, Download, CalendarDays, Clock, User, BriefcaseMedical, DollarSign, Hash, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ReceiptClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAppointmentById, clearCurrentAppointment } = useAppointment();
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const transactionId = searchParams.get('transactionId');
    if (!transactionId) {
      toast({ variant: "destructive", title: "Error", description: "No transaction ID found." });
      router.push('/');
      return;
    }

    const appointmentData = getAppointmentById(transactionId) as ReceiptData | undefined; // Cast as ReceiptData, assuming id is transactionId
    
    if (appointmentData) {
       // Ensure paymentDate is set if it wasn't stored before
      const finalReceiptData: ReceiptData = {
        ...appointmentData,
        paymentDate: appointmentData.paymentDate || new Date() 
      };
      setReceipt(finalReceiptData);
    } else {
      toast({ variant: "destructive", title: "Error", description: "Receipt not found. It might have expired or is invalid." });
      router.push('/dashboard'); // Or home
    }
    setIsLoading(false);
    // Clear current booking flow data after receipt is shown
    clearCurrentAppointment();
    
  }, [searchParams, getAppointmentById, router, toast, clearCurrentAppointment]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };
  
  // Dummy share and download functions
  const handleShare = () => {
    toast({ title: "Share (Not Implemented)", description: "This feature would typically allow sharing the receipt." });
  };
  const handleDownload = () => {
    toast({ title: "Download (Not Implemented)", description: "This feature would allow downloading a PDF of the receipt." });
  };


  if (isLoading) {
    return (
      <div className="container py-12 md:py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!receipt) {
     // Already handled by redirect in useEffect, but as a fallback:
    return (
      <div className="container py-12 md:py-16 text-center">
        <h1 className="text-2xl font-bold">Receipt Not Found</h1>
        <p className="text-muted-foreground">We couldn't find the details for this receipt.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 bg-secondary/30 print:bg-white">
      <Card className="max-w-2xl mx-auto shadow-xl print:shadow-none print:border-none">
        <CardHeader className="bg-primary/10 print:bg-transparent p-6 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <HealthFirstLogo className="h-12 w-12" />
              <div>
                <CardTitle className="text-3xl font-headline text-primary">{APP_NAME}</CardTitle>
                <CardDescription className="text-primary/80">Official Appointment Receipt</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">Receipt #{receipt.transactionId}</p>
              <p className="text-sm text-muted-foreground">Paid on: {format(new Date(receipt.paymentDate), 'PPP p')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold">Appointment Confirmed!</h2>
            <p className="text-muted-foreground">Thank you for your payment. Your appointment is successfully booked.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <h3 className="col-span-1 sm:col-span-2 text-lg font-semibold text-primary border-b pb-2 mb-2">Appointment Details</h3>
            
            <div className="flex items-start">
              <BriefcaseMedical className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <span className="text-muted-foreground">Service:</span><br/>
                <strong className="text-base">{receipt.serviceName}</strong>
              </div>
            </div>
            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <span className="text-muted-foreground">Amount Paid:</span><br/>
                <strong className="text-base">${receipt.price.toFixed(2)}</strong>
              </div>
            </div>
            <div className="flex items-start">
              <CalendarDays className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <span className="text-muted-foreground">Date:</span><br/>
                <strong className="text-base">{format(new Date(receipt.date), 'EEEE, MMMM dd, yyyy')}</strong>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <span className="text-muted-foreground">Time:</span><br/>
                <strong className="text-base">{receipt.time}</strong>
              </div>
            </div>

            <h3 className="col-span-1 sm:col-span-2 text-lg font-semibold text-primary border-b pb-2 mt-4 mb-2">Patient Information</h3>
            <div className="flex items-start">
              <User className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <span className="text-muted-foreground">Name:</span><br/>
                <strong className="text-base">{receipt.patientName}</strong>
              </div>
            </div>
            <div className="flex items-start">
              <User className="h-5 w-5 text-primary mr-3 mt-1 shrink-0 opacity-0" /> {/* Placeholder for alignment */}
              <div>
                 <span className="text-muted-foreground">Email:</span><br/>
                <strong className="text-base">{receipt.patientEmail}</strong>
              </div>
            </div>
            {receipt.patientPhone && (
              <div className="flex items-start">
                <User className="h-5 w-5 text-primary mr-3 mt-1 shrink-0 opacity-0" /> {/* Placeholder for alignment */}
                <div>
                  <span className="text-muted-foreground">Phone:</span><br/>
                  <strong className="text-base">{receipt.patientPhone}</strong>
                </div>
              </div>
            )}
            {receipt.patientPreferences && (
               <div className="col-span-1 sm:col-span-2 flex items-start">
                <User className="h-5 w-5 text-primary mr-3 mt-1 shrink-0 opacity-0" /> {/* Placeholder for alignment */}
                <div>
                  <span className="text-muted-foreground">Preferences:</span><br/>
                  <strong className="text-base">{receipt.patientPreferences}</strong>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t print:hidden">
            <p className="text-xs text-muted-foreground text-center mb-4">
              If you have any questions regarding your appointment, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Receipt</Button>
              <Button onClick={handleDownload} variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
              <Button onClick={handleShare} variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            </div>
             <div className="mt-6 text-center">
              <Button onClick={() => router.push('/dashboard')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
