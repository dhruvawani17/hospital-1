
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addDays, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAppointment } from '@/contexts/AppointmentContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { Service } from '@/types';
import { SERVICES_DATA } from '@/lib/constants';
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
  const { currentAppointment, updateAppointmentData, startNewAppointment, getAvailableTimeSlots } = useAppointment();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentAppointment?.date ? new Date(currentAppointment.date) : undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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

  // Fetch available slots when service or date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const serviceId = form.getValues("serviceId");
      if (serviceId && selectedDate) {
        setIsLoadingSlots(true);
        try {
          const slots = await getAvailableTimeSlots(serviceId, selectedDate);
          setAvailableTimeSlots(slots);
          
          // Clear selected time if it's no longer available
          const currentTime = form.getValues("time");
          if (currentTime && !slots.includes(currentTime)) {
            form.setValue("time", "");
            toast({
              title: "Time Slot Updated",
              description: "Your selected time slot is no longer available. Please choose a new time.",
            });
          }
        } catch (error) {
          console.error("Error fetching available slots:", error);
          setAvailableTimeSlots([]);
          toast({
            variant: "destructive",
            title: "Error Loading Slots",
            description: "Could not load available time slots. Please try again.",
          });
        } finally {
          setIsLoadingSlots(false);
        }
      } else {
        setAvailableTimeSlots([]);
      }
    };

    fetchAvailableSlots();
  }, [form, selectedDate, getAvailableTimeSlots, toast]);
  

  async function onSubmit(data: AppointmentFormValues) {
    updateAppointmentData(data);
    toast({
      title: t('appointmentDetailsSaved'),
      description: t('proceedingToPayment'),
    });
    router.push('/payment');
  }

  return (
    <div className="container py-12 md:py-16">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">{t('bookYourAppointment')}</CardTitle>
          <CardDescription className="text-center">
            {t('bookYourAppointmentDesc')}
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
                    <FormLabel className="text-lg font-semibold flex items-center"><BriefcaseMedical className="mr-2 h-5 w-5 text-primary" />{t('selectService')}</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        const service = SERVICES_DATA.find(s => s.id === value);
                        if (service) startNewAppointment(service); // Update context
                        // Clear time selection when service changes
                        form.setValue("time", "");
                      }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t('chooseMedicalService')} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICES_DATA.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} (₹{service.price.toFixed(2)})
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
                      <FormLabel className="text-lg font-semibold flex items-center"><CalendarIcon className="mr-2 h-5 w-5 text-primary" />{t('appointmentDate')}</FormLabel>
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
                              {field.value ? format(field.value, "PPP") : <span>{t('pickADate')}</span>}
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
                              // Clear time selection when date changes
                              form.setValue("time", "");
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
                      <FormLabel className="text-lg font-semibold flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-primary" />
                        {t('appointmentTime')}
                      </FormLabel>
                       <Select 
                         onValueChange={field.onChange} 
                         defaultValue={field.value} 
                         disabled={!selectedDate || !form.getValues("serviceId") || isLoadingSlots}
                       >
                        <FormControl>
                          <SelectTrigger disabled={!selectedDate || !form.getValues("serviceId") || isLoadingSlots}>
                            <SelectValue placeholder={
                              !selectedDate ? t('selectDateFirst') : 
                              !form.getValues("serviceId") ? "Select service first" :
                              isLoadingSlots ? "Loading available slots..." :
                              availableTimeSlots.length === 0 ? "No available slots" :
                              t('selectTimeSlot')
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTimeSlots.length > 0 ? (
                            availableTimeSlots.map(slot => (
                              <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                            ))
                          ) : (
                            !isLoadingSlots && selectedDate && form.getValues("serviceId") && (
                              <SelectItem value="" disabled>No available slots for this date</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      {!selectedDate && <FormDescription>{t('selectDateToEnable')}</FormDescription>}
                      {selectedDate && !form.getValues("serviceId") && <FormDescription>Please select a service first</FormDescription>}
                      {selectedDate && form.getValues("serviceId") && availableTimeSlots.length === 0 && !isLoadingSlots && 
                        <FormDescription className="text-orange-600">No available time slots for this date. Please choose a different date.</FormDescription>
                      }
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">{t('yourInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />{t('fullName')}</FormLabel>
                        <FormControl><Input placeholder={t('johnDoePlaceholder')} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />{t('emailAddress')}</FormLabel>
                        <FormControl><Input type="email" placeholder={t('emailPlaceholder')} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary" />{t('phoneNumber')}</FormLabel>
                        <FormControl><Input type="tel" placeholder={t('phonePlaceholder')} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('proceedToPayment')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
