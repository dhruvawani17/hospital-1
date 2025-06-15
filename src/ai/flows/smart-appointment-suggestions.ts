// src/ai/flows/smart-appointment-suggestions.ts
'use server';

/**
 * @fileOverview Provides smart appointment suggestions based on doctor availability and other factors.
 *
 * - `suggestAppointmentTimes` - A function that suggests available appointment times.
 * - `SmartAppointmentSuggestionsInput` - The input type for the `suggestAppointmentTimes` function.
 * - `SmartAppointmentSuggestionsOutput` - The return type for the `suggestAppointmentTimes` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartAppointmentSuggestionsInputSchema = z.object({
  patientPreferences: z
    .string()
    .describe('The patient preferences for the appointment.'),
  doctorAvailability: z
    .string()
    .describe('The current availability of the doctor.'),
  appointmentType: z
    .string()
    .describe('The type of appointment the patient is looking for.'),
  currentTime: z.string().describe('The current time.'),
});
export type SmartAppointmentSuggestionsInput = z.infer<
  typeof SmartAppointmentSuggestionsInputSchema
>;

const SmartAppointmentSuggestionsOutputSchema = z.object({
  suggestedAppointmentTimes: z
    .array(z.string())
    .describe('A list of suggested appointment times.'),
  reasoning: z.string().describe('The reasoning behind the suggestions.'),
});
export type SmartAppointmentSuggestionsOutput = z.infer<
  typeof SmartAppointmentSuggestionsOutputSchema
>;

export async function suggestAppointmentTimes(
  input: SmartAppointmentSuggestionsInput
): Promise<SmartAppointmentSuggestionsOutput> {
  return smartAppointmentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartAppointmentSuggestionsPrompt',
  input: {schema: SmartAppointmentSuggestionsInputSchema},
  output: {schema: SmartAppointmentSuggestionsOutputSchema},
  prompt: `You are an AI assistant that suggests appointment times based on patient preferences and doctor availability.

  Current Time: {{{currentTime}}}
  Patient Preferences: {{{patientPreferences}}}
  Doctor Availability: {{{doctorAvailability}}}
  Appointment Type: {{{appointmentType}}}

  Consider the patient's preferences, doctor's availability, and the type of appointment to suggest the best possible times.

  Respond with an array of suggested times and a reasoning for why these times were suggested.
  Ensure the times are within the doctor's availability and appropriate for the appointment type.
  Output should be formatted as a JSON object.
  `,
});

const smartAppointmentSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartAppointmentSuggestionsFlow',
    inputSchema: SmartAppointmentSuggestionsInputSchema,
    outputSchema: SmartAppointmentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
