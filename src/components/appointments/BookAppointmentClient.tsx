
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAppointment } from '@/contexts/AppointmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppointmentFormData, Service } from '@/types';
import { SERVICES_DATA, MOCK_TIME_SLOTS, DOCTORS_DATA, SERVICE_DOCTORS } from '@/lib/constants';
import { tryLockSlot, subscribeToDayLocks } from '@/lib/appointments';
import { CalendarIcon, Clock, User, Mail, Phone, Loader2, BriefcaseMedical } from 'lucide-react';
import { cn } from '@/lib/utils';


const appointmentFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service."),
  doctorId: z.string().min(1, "Please select a doctor."),
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
  const { currentAppointment, updateAppointmentData, startNewAppointment, createPendingAppointmentOnPayment } = useAppointment();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentAppointment?.date ? new Date(currentAppointment.date) : undefined);
  const [lockedSlotsMap, setLockedSlotsMap] = useState<Record<string, any>>({});
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(currentAppointment?.doctorId || "");

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      serviceId: currentAppointment?.serviceId || "",
      doctorId: currentAppointment?.doctorId || "",
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
  
  // Booking user id (persist for anonymous sessions)
  const { user } = useAuth();
  const [bookingUserId, setBookingUserId] = useState<string>('');
  
  // Initialize booking user ID on client side only to avoid hydration mismatch
  useEffect(() => {
    if (user?.uid) {
      setBookingUserId(user.uid);
    } else if (typeof window !== 'undefined') {
      const k = 'bookingClientId';
      let id = localStorage.getItem(k);
      if (!id) {
        id = `client-${Math.random().toString(36).slice(2)}-${Date.now()}`;
        localStorage.setItem(k, id);
      }
      setBookingUserId(id);
    }
  }, [user?.uid]);

  function formatDateKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Subscribe to locks for the chosen doctor and date
  useEffect(() => {
    if (!form.getValues('serviceId') || !selectedDoctorId || !selectedDate || !bookingUserId) return;
    const dateKey = formatDateKey(selectedDate);
    const unsub = subscribeToDayLocks(form.getValues('serviceId'), selectedDoctorId, dateKey, (locks) => {
      setLockedSlotsMap(locks);
    });
    return () => unsub();
  }, [form, selectedDoctorId, selectedDate, bookingUserId]);

  const disabledSlots = useMemo(() => {
    const set = new Set<string>();
    const now = Date.now();
    Object.values(lockedSlotsMap).forEach((lock: any) => {
      const expires = lock.expiresAt?.toMillis?.() ? lock.expiresAt.toMillis() : 0;
      const booked = !!lock.booked;
      const lockedByOther = lock.lockedBy && lock.lockedBy !== bookingUserId;
      if (booked || (lockedByOther && expires > now)) {
        set.add(lock.time);
      }
    });
    return set;
  }, [lockedSlotsMap, bookingUserId]);
  

  async function onSubmit(data: AppointmentFormValues) {
    // Create pending appointment in database with the form data
    const appointmentId = await createPendingAppointmentOnPayment(data);
    if (!appointmentId) {
      // Error toast is already shown in createPendingAppointmentOnPayment
      return;
    }
    
    toast({
      title: t('appointmentDetailsSaved'),
      description: t('proceedingToPayment'),
    });
    router.push('/payment');
  }

  const availableDoctors = useMemo(() => {
    const serviceId = form.getValues('serviceId');
    if (!serviceId) return [] as typeof DOCTORS_DATA;
    const ids = SERVICE_DOCTORS[serviceId] || [];
    return DOCTORS_DATA.filter(d => ids.includes(d.id));
  }, [form.watch('serviceId')]);

  const handleTimeSelect = async (slot: string) => {
    const serviceId = form.getValues('serviceId');
    if (!serviceId || !selectedDoctorId || !selectedDate || !bookingUserId) return;
    if (disabledSlots.has(slot)) {
      toast({ variant: 'destructive', title: 'Slot Unavailable', description: 'This time is no longer available. Please choose another.' });
      return;
    }
    const dateKey = formatDateKey(selectedDate);
    const res = await tryLockSlot({ serviceId, doctorId: selectedDoctorId, date: dateKey, time: slot, userId: bookingUserId });
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Could not reserve slot', description: res.reason || 'Please choose another time.' });
      form.setValue('time', '');
      return;
    }
    form.setValue('time', slot);
    updateAppointmentData({ time: slot });
  };

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
                        // Reset doctor/time on service change
                        form.setValue('doctorId', '');
                        setSelectedDoctorId('');
                        form.setValue('time', '');
                        setLockedSlotsMap({});
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

              {/* Doctor Selection */}
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Select Doctor</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDoctorId(value);
                        updateAppointmentData({ doctorId: value });
                        // Reset time when doctor changes
                        form.setValue('time', '');
                      }}
                      disabled={!form.getValues('serviceId')}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger disabled={!form.getValues('serviceId')}>
                          <SelectValue placeholder={form.getValues('serviceId') ? 'Choose a doctor' : 'Select service first'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDoctors.map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name} — {doc.specialty}
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
                      <FormLabel className="text-lg font-semibold flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" />{t('appointmentTime')}</FormLabel>
                       <Select onValueChange={(v) => handleTimeSelect(v)} value={field.value} disabled={!selectedDate || !selectedDoctorId}>
                        <FormControl>
                          <SelectTrigger disabled={!selectedDate || !selectedDoctorId}>
                            <SelectValue placeholder={!selectedDate ? t('selectDateFirst') : (!selectedDoctorId ? 'Select doctor first' : t('selectTimeSlot'))} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_TIME_SLOTS.map(slot => (
                            <SelectItem key={slot} value={slot} disabled={disabledSlots.has(slot)}>
                              {slot}{disabledSlots.has(slot) ? ' — Unavailable' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedDate && <FormDescription>{t('selectDateToEnable')}</FormDescription>}
                      {selectedDate && !selectedDoctorId && <FormDescription>Select a doctor to see available times.</FormDescription>}
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
