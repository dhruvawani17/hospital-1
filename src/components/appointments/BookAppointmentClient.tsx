
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { addDays, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAppointment } from '@/contexts/AppointmentContext';
import type { AppointmentFormData, Service } from '@/types';
import { SERVICES_DATA, DOCTOR_AVAILABILITY_STRING, MOCK_TIME_SLOTS } from '@/lib/constants';
import { suggestAppointmentTimes, type SmartAppointmentSuggestionsInput, type SmartAppointmentSuggestionsOutput } from '@/ai/flows/smart-appointment-suggestions';
import { CalendarIcon, Clock, Sparkles, User, Mail, Phone, Info, Loader2, BriefcaseMedical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from "@/components/ui/label";


const appointmentFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service."),
  patientPreferences: z.string().optional(),
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
  
  const [aiSuggestions, setAiSuggestions] = useState<SmartAppointmentSuggestionsOutput | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentAppointment?.date ? new Date(currentAppointment.date) : undefined);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      serviceId: currentAppointment?.serviceId || "",
      patientPreferences: currentAppointment?.patientPreferences || "",
      date: currentAppointment?.date ? new Date(currentAppointment.date) : undefined,
      time: currentAppointment?.time || "",
      patientName: currentAppointment?.patientName || "",
      patientEmail: currentAppointment?.patientEmail || "",
      patientPhone: currentAppointment?.patientPhone || "",
    },
  });

  const selectedService = useMemo(() => 
    SERVICES_DATA.find(s => s.id === form.watch("serviceId")),
    [form.watch("serviceId")]
  );

  useEffect(() => {
    if (currentAppointment?.serviceId && !form.getValues("serviceId")) {
      form.setValue("serviceId", currentAppointment.serviceId);
    }
  }, [currentAppointment, form]);
  
  const handleAiSuggest = async () => {
    const serviceId = form.getValues("serviceId");
    const patientPreferences = form.getValues("patientPreferences");

    if (!serviceId) {
      toast({ variant: "destructive", title: "Select Service", description: "Please select a service before getting suggestions." });
      return;
    }
    const service = SERVICES_DATA.find(s => s.id === serviceId);
    if (!service) return;

    setIsLoadingAiSuggestions(true);
    setAiSuggestions(null);
    try {
      const input: SmartAppointmentSuggestionsInput = {
        patientPreferences: patientPreferences || "No specific preferences.",
        doctorAvailability: DOCTOR_AVAILABILITY_STRING,
        appointmentType: service.name,
        currentTime: new Date().toISOString(),
      };
      const suggestions = await suggestAppointmentTimes(input);
      setAiSuggestions(suggestions);
      if (suggestions.suggestedAppointmentTimes.length > 0) {
        toast({ title: "AI Suggestions Ready", description: "Check the suggested times below." });
      } else {
        toast({ title: "AI Suggestions", description: "No specific times found, please choose manually or refine preferences." });
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Could not fetch AI suggestions. Please try again or book manually." });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const applyAiSuggestion = (suggestedTime: string) => {
    // This is a simplified parsing. A robust solution would parse date and time from suggestedTime.
    // For now, we assume suggestedTime is just a time string like "10:00 AM" and the date needs to be selected manually or set to a default.
    // A more advanced AI could return date + time.
    
    // Try to parse date from suggestion if available (e.g. "2024-08-15 10:00 AM")
    const dateTimeParts = suggestedTime.match(/(\d{4}-\d{2}-\d{2})\s*(.*)/);
    if (dateTimeParts && dateTimeParts[1] && dateTimeParts[2]) {
      const datePart = new Date(dateTimeParts[1] + 'T00:00:00'); // Ensure local timezone interpretation for date part
      const timePart = dateTimeParts[2];
      if (!isNaN(datePart.getTime())) {
        form.setValue("date", datePart, { shouldValidate: true });
        setSelectedDate(datePart);
      }
      form.setValue("time", timePart.trim(), { shouldValidate: true });
    } else {
      // If only time is suggested, or parsing fails, just set time. User must pick date.
      form.setValue("time", suggestedTime, { shouldValidate: true });
      if(!selectedDate){
         toast({ title: "Date Required", description: "Please select a date for the suggested time.", variant: "destructive" });
      }
    }
    toast({ title: "Suggestion Applied", description: `Time set to ${suggestedTime}. Please confirm or select a date.` });
  };


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
                        setAiSuggestions(null); // Reset AI suggestions when service changes
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

              {/* Patient Preferences & AI Suggestions */}
              {selectedService && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" />Smart Scheduler (AI Powered)</CardTitle>
                    <CardDescription>Tell us your preferences, and our AI will suggest the best slots for your {selectedService.name}.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="patientPreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Preferences (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g., 'Morning preferred', 'Available after 5 PM on weekdays', 'Need a female doctor'" {...field} />
                          </FormControl>
                          <FormDescription>Any specific needs or times you prefer?</FormDescription>
                        </FormItem>
                      )}
                    />
                    <Button type="button" onClick={handleAiSuggest} disabled={isLoadingAiSuggestions} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      {isLoadingAiSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Get AI Suggestions
                    </Button>
                    {isLoadingAiSuggestions && <p className="text-sm text-muted-foreground">AI is thinking... Please wait.</p>}
                    {aiSuggestions && (
                      <div className="mt-4 space-y-3 p-4 border rounded-md bg-background">
                        <h4 className="font-semibold text-md">AI Suggested Times:</h4>
                        {aiSuggestions.suggestedAppointmentTimes.length > 0 ? (
                          <RadioGroup
                            onValueChange={applyAiSuggestion}
                            className="grid grid-cols-2 md:grid-cols-3 gap-2"
                          >
                            {aiSuggestions.suggestedAppointmentTimes.slice(0,6).map((time, index) => ( // Show max 6 suggestions
                              <FormItem key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={time} id={`ai-time-${index}`} />
                                <Label htmlFor={`ai-time-${index}`} className="font-normal cursor-pointer p-2 border rounded-md hover:bg-accent/10 w-full text-sm">{time}</Label>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        ) : (
                          <p className="text-sm text-muted-foreground">No specific times available based on your preferences. Try adjusting or select manually.</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2"><Info className="inline h-3 w-3 mr-1"/><strong>AI Reasoning:</strong> {aiSuggestions.reasoning}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
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

    

    