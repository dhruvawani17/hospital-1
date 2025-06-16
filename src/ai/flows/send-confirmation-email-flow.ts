
'use server';
/**
 * @fileOverview A Genkit flow for sending appointment confirmation emails.
 * This flow is currently a simulation and logs email details to the console.
 * It's designed to be called by a Firebase Function triggered by a Firestore event.
 *
 * - sendConfirmationEmail - A function that processes the email sending request.
 * - SendConfirmationEmailInput - The input type for the sendConfirmationEmail function.
 * - SendConfirmationEmailOutput - The return type for the sendConfirmationEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { APP_NAME } from '@/lib/constants';

export const SendConfirmationEmailInputSchema = z.object({
  toEmail: z.string().email().describe("The recipient's email address."),
  patientName: z.string().describe("The name of the patient."),
  serviceName: z.string().describe("The name of the booked service."),
  appointmentDate: z.string().describe("The date of the appointment (e.g., 'YYYY-MM-DD')."),
  appointmentTime: z.string().describe("The time of the appointment (e.g., 'HH:MM AM/PM')."),
  transactionId: z.string().describe("The transaction ID for the booking."),
  price: z.number().describe("The price of the service."),
  receiptUrl: z.string().url().describe("The URL to view the full receipt."),
});
export type SendConfirmationEmailInput = z.infer<typeof SendConfirmationEmailInputSchema>;

export const SendConfirmationEmailOutputSchema = z.object({
  success: z.boolean().describe("Indicates whether the email sending process was initiated successfully (simulated)."),
  message: z.string().describe("A message describing the outcome of the email sending process."),
});
export type SendConfirmationEmailOutput = z.infer<typeof SendConfirmationEmailOutputSchema>;

export async function sendConfirmationEmail(input: SendConfirmationEmailInput): Promise<SendConfirmationEmailOutput> {
  return sendConfirmationEmailFlow(input);
}

const sendConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'sendConfirmationEmailFlow',
    inputSchema: SendConfirmationEmailInputSchema,
    outputSchema: SendConfirmationEmailOutputSchema,
  },
  async (input: SendConfirmationEmailInput): Promise<SendConfirmationEmailOutput> => {
    console.log(`[sendConfirmationEmailFlow] Simulating sending email to: ${input.toEmail}`);
    console.log("[sendConfirmationEmailFlow] Email Details:");
    console.log(`  Patient Name: ${input.patientName}`);
    console.log(`  Service: ${input.serviceName}`);
    console.log(`  Date: ${input.appointmentDate}`);
    console.log(`  Time: ${input.appointmentTime}`);
    console.log(`  Transaction ID: ${input.transactionId}`);
    console.log(`  Price: ₹${input.price.toFixed(2)}`);
    console.log(`  Receipt URL: ${input.receiptUrl}`);
    console.log(`  App Name: ${APP_NAME}`);

    // In a real implementation, you would integrate with an email service SDK here.
    // For example, using SendGrid, Mailgun, etc.
    // This would involve:
    // 1. Configuring the email service provider with API keys (securely).
    // 2. Constructing the email body (HTML or text).
    // 3. Sending the email using the provider's SDK.

    const simulatedMessage = `Simulated: Appointment confirmation email for ${input.serviceName} would be sent to ${input.toEmail}.`;
    
    // For demonstration, return success
    return {
      success: true,
      message: simulatedMessage,
    };
  }
);
