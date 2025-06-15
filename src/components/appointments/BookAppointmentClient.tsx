
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addDays, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAppointment } from '@/contexts/AppointmentContext';
import type { AppointmentFormData, Service } from '@/types';
import { SERVICES_DATA, MOCK_TIME_SLOTS } from '@/lib/constants';
import { CalendarIcon, Clock, User, Mail, Phone, Loader2, BriefcaseMedical } from 'lucide-react';
import { cn } from '@/lib/utils';


const appointmentFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service."),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().min(1, "Please select a time slot."),
  patientName: z.string().min(2, "Name must be at least 2 characters."),
  patientEmail: z.string().email("Invalid email address."),
  patientPhone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format."),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export function BookAppointmentClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentAppointment, updateAppointmentData, startNewAppointment } = useAppointment();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentAppointment?.date ? new Date(currentAppointment.date) : undefined);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      serviceId: currentAppointment?.serviceId || "",
      date: currentAppointment?.date ? new Date(currentAppointment.date) : undefined,
      time: currentAppointment?.time || "",
      patientName: currentAppointment?.patientName || "",
      patientEmail: currentAppointment?.patientEmail || "",
      patientPhone: currentAppointment?.patientPhone || "",
    },
  });

  useEffect(() => {
    if (currentAppointment?.serviceId && !form.getValues("serviceId")) {
      form.setValue("serviceId", currentAppointment.serviceId);
    }
  }, [currentAppointment, form]);
  

  async function onSubmit(data: AppointmentFormValues) {
    updateAppointmentData(data);
    toast({
      title: "Appointment Details Saved",
      description: "Proceeding to payment.",
    });
    router.push('/payment');
  }

  return (
    <div className="container py-12 md:py-16">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Book Your Appointment</CardTitle>
          <CardDescription className="text-center">
            Fill in your details and preferences to schedule your visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Service Selection */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold flex items-center"><BriefcaseMedical className="mr-2 h-5 w-5 text-primary" />Select Service</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        const service = SERVICES_DATA.find(s => s.id === value);
                        if (service) startNewAppointment(service); // Update context
                      }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choose a medical service" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICES_DATA.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} (${service.price.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-lg font-semibold flex items-center"><CalendarIcon className="mr-2 h-5 w-5 text-primary" />Appointment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setSelectedDate(date);
                            }}
                            disabled={(date) => date < addDays(new Date(), -1) || date < new Date("1900-01-01")} // Disable past dates
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" />Appointment Time</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDate}>
                        <FormControl>
                          <SelectTrigger disabled={!selectedDate}>
                            <SelectValue placeholder={!selectedDate ? "Select a date first" : "Select a time slot"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_TIME_SLOTS.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedDate && <FormDescription>Please select a date to enable time slots.</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary" />Phone Number</FormLabel>
                        <FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Proceed to Payment
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
