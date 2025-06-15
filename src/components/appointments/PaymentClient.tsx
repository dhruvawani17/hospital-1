
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppointment } from '@/contexts/AppointmentContext';
import { SERVICES_DATA } from '@/lib/constants';
import type { Service } from '@/types';
import { AlertCircle, CheckCircle, CreditCard, CalendarDays, User, BriefcaseMedical, DollarSign, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const paymentFormSchema = z.object({
  cardNumber: z.string()
    .min(16, "Card number must be 16 digits.")
    .max(16, "Card number must be 16 digits.")
    .regex(/^\d{16}$/, "Invalid card number format. Must be 16 digits."),
  expiryDate: z.string()
    .min(5, "Expiry date must be MM/YY.")
    .max(5, "Expiry date must be MM/YY.")
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date format. Use MM/YY."),
  cvc: z.string()
    .min(3, "CVC must be 3 digits.")
    .max(3, "CVC must be 3 digits.")
    .regex(/^\d{3}$/, "Invalid CVC format. Must be 3 digits."),
  cardHolderName: z.string().min(2, "Cardholder name is required."),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function PaymentClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentAppointment, confirmAppointment, clearCurrentAppointment } = useAppointment();
  const [serviceDetails, setServiceDetails] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentAppointment || !currentAppointment.serviceId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No appointment details found. Please book an appointment first.",
      });
      router.push('/book-appointment');
      return;
    }
    const service = SERVICES_DATA.find(s => s.id === currentAppointment.serviceId);
    if (service) {
      setServiceDetails(service);
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Service details not found for this appointment.",
      });
      router.push('/book-appointment');
    }
  }, [currentAppointment, router, toast]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvc: "",
      cardHolderName: currentAppointment?.patientName || "",
    },
  });
  
  useEffect(() => {
    if(currentAppointment?.patientName) {
      form.setValue("cardHolderName", currentAppointment.patientName);
    }
  }, [currentAppointment?.patientName, form]);

  if (!currentAppointment || !serviceDetails) {
    return (
      <div className="container py-12 md:py-16 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transactionId = `RCPT-${Date.now()}`; // Updated format
    const receiptData = confirmAppointment({ transactionId });
    
    setIsLoading(false);
    if (receiptData) {
      toast({
        title: "Payment Successful!",
        description: "Your appointment is confirmed.",
        action: <CheckCircle className="text-green-500" />,
      });
      router.push(`/receipt?transactionId=${transactionId}`);
    } else {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Could not confirm appointment. Please try again.",
      });
    }
  };
  
  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><BriefcaseMedical className="mr-2 h-4 w-4 text-primary"/>Service:</span>
              <strong>{serviceDetails.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4 text-primary"/>Patient:</span>
              <strong>{currentAppointment.patientName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary"/>Date & Time:</span>
              <strong>{currentAppointment.date ? format(new Date(currentAppointment.date), "PPP") : 'N/A'} at {currentAppointment.time}</strong>
            </div>
             <hr className="my-3"/>
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-muted-foreground flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/>Total Amount:</span>
              <span className="text-primary">${serviceDetails.price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Simulated Payment</CardTitle>
            <CardDescription className="text-center">
              Enter your card details to confirm your appointment. This is a simulation, no real transaction will occur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cardHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cardholder Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl><Input className="pl-10" placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl><Input placeholder="MM/YY" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cvc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl><Input placeholder="123" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Alert variant="default" className="bg-primary/10 border-primary/20">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Simulation Notice</AlertTitle>
                  <AlertDescription>
                    This is a payment simulation. Any card details will work (e.g., 16 zeros for card number). No real charges will be made.
                  </AlertDescription>
                </Alert>
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" /> }
                  Pay ${serviceDetails.price.toFixed(2)} & Confirm
                </Button>
              </form>
            </Form>
          </CardContent>
           <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.back()} disabled={isLoading}>
              Cancel and Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
