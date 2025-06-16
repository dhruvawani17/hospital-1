
'use server';
/**
 * @fileOverview A Genkit flow for sending appointment confirmation emails using SendGrid.
 *
 * - sendConfirmationEmail - A function that processes the email sending request.
 * - SendConfirmationEmailInput - The input type for the sendConfirmationEmail function.
 * - SendConfirmationEmailOutput - The return type for the sendConfirmationEmail function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import sgMail from '@sendgrid/mail';
import { APP_NAME } from '@/lib/constants';

const SendConfirmationEmailInputSchema = z.object({
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

const SendConfirmationEmailOutputSchema = z.object({
  success: z.boolean().describe("Indicates whether the email sending process was successful."),
  message: z.string().describe("A message describing the outcome of the email sending process."),
  messageId: z.string().optional().describe("The SendGrid message ID if the email was accepted."),
});
export type SendConfirmationEmailOutput = z.infer<typeof SendConfirmationEmailOutputSchema>;

// Helper function to mask API Key for logging
const maskApiKey = (key: string | undefined) => {
  if (!key) return "undefined (API Key not found in environment)";
  if (key.length < 10) return "API Key too short to mask meaningfully";
  return `${key.substring(0, 5)}...${key.substring(key.length - 5)}`;
};

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
    console.log('[sendConfirmationEmailFlow] Initiated with input:', JSON.stringify(input));

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    console.log(`[sendConfirmationEmailFlow] Attempting to use API Key (masked): ${maskApiKey(apiKey)}`);
    console.log(`[sendConfirmationEmailFlow] Attempting to use From Email: ${fromEmail || "undefined (FROM_EMAIL not found in environment)"}`);

    if (!apiKey) {
      console.error("[sendConfirmationEmailFlow] Critical Error: SENDGRID_API_KEY not found in environment variables. Cannot send email.");
      return { success: false, message: "Configuration error: SendGrid API Key not found. Email not sent." };
    }

    if (!fromEmail) {
      console.error("[sendConfirmationEmailFlow] Critical Error: SENDGRID_FROM_EMAIL not found in environment variables. Cannot send email.");
      return { success: false, message: "Configuration error: SendGrid From Email not found. Email not sent." };
    }

    sgMail.setApiKey(apiKey);

    const emailHtmlBody = `
      <html>
        <body>
          <p>Dear ${input.patientName},</p>
          <p>Thank you for booking your appointment with ${APP_NAME}.</p>
          <p><strong>Appointment Details:</strong></p>
          <ul>
            <li><strong>Service:</strong> ${input.serviceName}</li>
            <li><strong>Date:</strong> ${input.appointmentDate}</li>
            <li><strong>Time:</strong> ${input.appointmentTime}</li>
            <li><strong>Price:</strong> ₹${input.price.toFixed(2)}</li>
            <li><strong>Transaction ID:</strong> ${input.transactionId}</li>
          </ul>
          <p>You can view your full receipt here: <a href="${input.receiptUrl}">${input.receiptUrl}</a></p>
          <p>We look forward to seeing you!</p>
          <p>Sincerely,<br/>The ${APP_NAME} Team</p>
        </body>
      </html>
    `;

    const msg = {
      to: input.toEmail,
      from: fromEmail, // This should be your verified sender email from .env
      subject: `Your Appointment Confirmation with ${APP_NAME} - #${input.transactionId}`,
      html: emailHtmlBody,
    };

    try {
      console.log(`[sendConfirmationEmailFlow] Preparing to send email via SendGrid. To: ${input.toEmail}, From: ${fromEmail}, Subject: ${msg.subject}`);
      const response = await sgMail.send(msg); // response is an array: [ClientResponse, {}]
      const clientResponse = response[0];
      const messageId = clientResponse.headers['x-message-id'];

      console.log('[sendConfirmationEmailFlow] Email sent successfully via SendGrid. Status code:', clientResponse.statusCode);
      console.log('[sendConfirmationEmailFlow] SendGrid Response Headers:', JSON.stringify(clientResponse.headers));
      if (messageId) {
        console.log('[sendConfirmationEmailFlow] SendGrid X-Message-Id:', messageId);
      }
      
      return {
        success: true,
        message: `Appointment confirmation email successfully sent to ${input.toEmail}. SendGrid status: ${clientResponse.statusCode}`,
        messageId: messageId
      };
    } catch (error: any) {
      console.error('[sendConfirmationEmailFlow] Error sending email with SendGrid. Raw error object:', error);
      let errorMessage = 'Unknown SendGrid error';
      if (error.message) {
        errorMessage = error.message;
        console.error('[sendConfirmationEmailFlow] Error Message:', error.message);
      }
      if (error.code) {
        console.error('[sendConfirmationEmailFlow] Error Code:', error.code);
      }
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('[sendConfirmationEmailFlow] SendGrid API Error Body (parsed):', JSON.stringify(error.response.body.errors));
        errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
      } else if (error.response && error.response.body) {
        // Log the raw body if it's not the expected errors array
        console.error('[sendConfirmationEmailFlow] SendGrid API Error Body (raw):', JSON.stringify(error.response.body));
      }
      // Stringify the whole error object to catch other potential properties
      console.error('[sendConfirmationEmailFlow] Full SendGrid Error Object (stringified):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      return {
        success: false,
        message: `Failed to send confirmation email. Error: ${errorMessage}`
      };
    }
  }
);
