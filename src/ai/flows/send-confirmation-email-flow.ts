
'use server';
/**
 * @fileOverview A Genkit flow for sending appointment confirmation emails using SendGrid.
 *
 * - sendConfirmationEmail - A function that processes the email sending request.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import sgMail from '@sendgrid/mail';
import { APP_NAME } from '@/lib/constants';

// Input and Output types are not exported due to 'use server' constraints
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
    console.log('[sendConfirmationEmailFlow] Initiated with input:', JSON.stringify(input));

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey) {
      console.error("[sendConfirmationEmailFlow] SENDGRID_API_KEY not found in environment variables.");
      return { success: false, message: "Configuration error: SendGrid API Key not found. Email not sent." };
    } else {
      console.log("[sendConfirmationEmailFlow] SENDGRID_API_KEY found.");
    }

    if (!fromEmail) {
      console.error("[sendConfirmationEmailFlow] SENDGRID_FROM_EMAIL not found in environment variables.");
      return { success: false, message: "Configuration error: SendGrid From Email not found. Email not sent." };
    } else {
      console.log("[sendConfirmationEmailFlow] SENDGRID_FROM_EMAIL found:", fromEmail);
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
      from: fromEmail,
      subject: `Your Appointment Confirmation with ${APP_NAME} - #${input.transactionId}`,
      html: emailHtmlBody,
    };

    try {
      console.log(`[sendConfirmationEmailFlow] Attempting to send email via SendGrid to: ${input.toEmail} from: ${fromEmail}`);
      const response = await sgMail.send(msg);
      console.log('[sendConfirmationEmailFlow] Email sent successfully via SendGrid. Response status code:', response[0].statusCode);
      return {
        success: true,
        message: `Appointment confirmation email successfully sent to ${input.toEmail}.`
      };
    } catch (error: any) {
      console.error('[sendConfirmationEmailFlow] Error sending email with SendGrid:', error);
      if (error.response) {
        console.error('[sendConfirmationEmailFlow] SendGrid Error Body:', JSON.stringify(error.response.body));
      }
      return {
        success: false,
        message: `Failed to send confirmation email. Error: ${error.message || 'Unknown SendGrid error'}`
      };
    }
  }
);
