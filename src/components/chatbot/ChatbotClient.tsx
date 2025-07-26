
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, ExternalLink, Upload, FileText, X } from 'lucide-react';
import { chatWithBot, type ChatInput, type ChatOutput } from '@/ai/flows/chatFlow';
import { analyzeMedicalReport, type MedicalReportInput, type MedicalReportOutput } from '@/ai/flows/medicalReportFlow';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME, SERVICES_DATA } from '@/lib/constants';
import { useAppointment } from '@/contexts/AppointmentContext';
import type { AppointmentFormData } from '@/types';


interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  receiptUrl?: string; 
  medicalReport?: {
    fileName: string;
    analysis?: MedicalReportOutput;
  };
}

export function ChatbotClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        text: `Hello! I'm MediBuddy, your AI assistant for ${APP_NAME}. I can help you in several ways:

🩺 **Book Appointments** - Ask me about our services or help you schedule appointments
📋 **Analyze Medical Reports** - Upload your medical reports and I'll provide a summary and insights
❓ **Answer Questions** - Get information about our services and general health tips

How can I assist you today?`,
        timestamp: new Date(),
      },
    ]);
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload an image file (JPG, PNG, etc.)"
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please upload an image smaller than 10MB"
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleMedicalReportAnalysis = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    
    try {
      const base64Data = await convertFileToBase64(uploadedFile);
      
      // Add user message showing they uploaded a report
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `I've uploaded a medical report: ${uploadedFile.name}`,
        timestamp: new Date(),
        medicalReport: {
          fileName: uploadedFile.name,
        }
      };
      setMessages(prev => [...prev, userMessage]);

      const analysisInput: MedicalReportInput = {
        imageData: base64Data,
        mimeType: uploadedFile.type,
        patientQuestion: inputValue.trim() || undefined,
      };

      const analysisResult = await analyzeMedicalReport(analysisInput);

      // Create bot response with analysis
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `I've analyzed your medical report. Here's what I found:

**Summary:**
${analysisResult.summary}

**Key Findings:**
${analysisResult.keyFindings.map(finding => `• ${finding}`).join('\n')}

**Recommendations:**
${analysisResult.recommendations}

${analysisResult.disclaimer}`,
        timestamp: new Date(),
        medicalReport: {
          fileName: uploadedFile.name,
          analysis: analysisResult,
        }
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Clear the uploaded file and input
      removeUploadedFile();
      setInputValue('');

      toast({
        title: "Analysis Complete",
        description: "Your medical report has been analyzed successfully."
      });

    } catch (error) {
      console.error('Error analyzing medical report:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to analyze the medical report. Please try again."
      });
    } finally {
      setIsAnalyzing(false);
    }
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
        
        const {
          serviceId,
          date: dateStr,
          time,
          patientName,
          patientEmail,
          patientPhone,
          transactionId
        } = response.bookingConfirmation;

        const serviceToBook = SERVICES_DATA.find(s => s.id === serviceId);
        if (serviceToBook) {
          // Ensure date string is parsed correctly, assuming YYYY-MM-DD and local timezone.
          // Add T00:00:00 to avoid timezone issues if dateStr is just YYYY-MM-DD.
          const dateObject = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);

          const appointmentDataForContext: Partial<AppointmentFormData> & { serviceId: string } = {
            serviceId: serviceToBook.id,
            date: dateObject, 
            time,
            patientName,
            patientEmail,
            patientPhone: patientPhone || '',
          };
          // Update the current appointment details in context FIRST
          updateAppointmentData(appointmentDataForContext);
          // Then confirm it, which will use the currentAppointment from context
          await confirmAppointmentInContext({ transactionId }); 
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
                    {msg.medicalReport && msg.sender === 'user' && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-800 font-medium">
                          Medical Report: {msg.medicalReport.fileName}
                        </span>
                      </div>
                    )}
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
          {/* File upload section */}
          {uploadedFile && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeUploadedFile}
                  disabled={isAnalyzing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={handleMedicalReportAnalysis}
                  disabled={isAnalyzing}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Medical Report'
                  )}
                </Button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder={uploadedFile ? "Ask a specific question about your report (optional)..." : "Type your message..."}
                value={inputValue}
                onChange={handleInputChange}
                className="flex-1"
                disabled={isLoading || isAnalyzing}
                autoComplete="off"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading || isAnalyzing}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isAnalyzing}
                title="Upload medical report"
              >
                <Upload className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || isAnalyzing || (!inputValue.trim() && !uploadedFile)} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
