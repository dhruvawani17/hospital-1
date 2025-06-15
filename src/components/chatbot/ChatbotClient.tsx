
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, ExternalLink } from 'lucide-react';
import { chatWithBot, type ChatInput, type ChatOutput } from '@/ai/flows/chatFlow';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME, SERVICES_DATA } from '@/lib/constants';
import { useAppointment } from '@/contexts/AppointmentContext';
import type { AppointmentFormData } from '@/types';


interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  receiptUrl?: string; // Optional: for "View Receipt" link
}

export function ChatbotClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { startNewAppointment, updateAppointmentData, confirmAppointment: confirmAppointmentInContext } = useAppointment();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: 'initial-greeting',
        sender: 'bot',
        text: `Hello! I'm MediBuddy, your AI assistant for ${APP_NAME}. How can I help you today? You can ask me about our services or to help book an appointment.`,
        timestamp: new Date(),
      },
    ]);
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: ChatInput = { userInput: trimmedInput };
      const response: ChatOutput = await chatWithBot(input);
      
      const newBotMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.botResponse,
        timestamp: new Date(),
      };
      
      if (response.bookingConfirmation) {
        newBotMessage.receiptUrl = response.bookingConfirmation.receiptUrl;
        
        // Update client-side AppointmentContext
        const {
          serviceId,
          date: dateStr, // This is YYYY-MM-DD string
          time,
          patientName,
          patientEmail,
          patientPhone,
          transactionId
        } = response.bookingConfirmation;

        const serviceToBook = SERVICES_DATA.find(s => s.id === serviceId);
        if (serviceToBook) {
          const appointmentDataForContext: Partial<AppointmentFormData> & { serviceId: string } = {
            serviceId: serviceToBook.id,
            date: new Date(dateStr + 'T00:00:00'), // Ensure date string is parsed correctly, assuming local timezone. Add T00:00:00 to avoid timezone issues.
            time,
            patientName,
            patientEmail,
            patientPhone: patientPhone || '',
          };
          updateAppointmentData(appointmentDataForContext);
          confirmAppointmentInContext({ transactionId }); // This saves to localStorage
        } else {
           toast({ variant: "destructive", title: "Booking Error", description: `Service ID ${serviceId} mismatch during confirmation.`});
        }
      }
      
      setMessages(prev => [...prev, newBotMessage]);

      if (response.bookingInitiation) {
        const { serviceId } = response.bookingInitiation;
        const serviceToBook = SERVICES_DATA.find(s => s.id === serviceId);

        if (serviceToBook) {
          startNewAppointment(serviceToBook);
          setTimeout(() => {
            router.push('/book-appointment');
          }, 1500);
        } else {
          toast({ variant: "destructive", title: "Booking Error", description: `Could not find service with ID ${serviceId} to start booking.` });
        }
      }
    } catch (error) {
      console.error("Error calling chat bot:", error);
      toast({ variant: "destructive", title: "Chatbot Error", description: "Sorry, I couldn't connect to the chatbot. Please try again later." });
       const errorBotMessage: Message = {
        id: `bot-error-${Date.now()}`,
        sender: 'bot',
        text: "I'm having a little trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="container py-8 md:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-2xl shadow-xl flex flex-col h-[70vh] min-h-[500px]">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback><Bot className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-headline text-primary">MediBuddy</CardTitle>
              <CardDescription>Your AI Assistant for {APP_NAME}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 text-sm shadow ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {msg.text.split('\n').map((line, index, arr) => (
                        <React.Fragment key={index}>
                        {line}
                        {index < arr.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                    {msg.receiptUrl && msg.sender === 'bot' && (
                      <p className="mt-2">
                        <Link href={msg.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-accent hover:underline font-semibold">
                          View Full Receipt <ExternalLink className="ml-1 h-4 w-4" />
                        </Link>
                      </p>
                    )}
                  </div>
                  {msg.sender === 'user' && (
                     <Avatar className="h-8 w-8">
                      <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="max-w-[70%] rounded-xl px-4 py-3 text-sm shadow bg-muted text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={handleInputChange}
              className="flex-1"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

    