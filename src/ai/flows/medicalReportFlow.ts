'use server';
/**
 * @fileOverview Medical Report Analysis Flow using Gemini Vision
 * 
 * This flow handles the analysis of uploaded medical reports and provides summaries
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MedicalReportInputSchema = z.object({
  imageData: z.string().describe('Base64 encoded image data of the medical report'),
  mimeType: z.string().describe('MIME type of the uploaded image (e.g., image/jpeg, image/png)'),
  patientQuestion: z.string().optional().describe('Optional specific question about the report'),
});

export type MedicalReportInput = z.infer<typeof MedicalReportInputSchema>;

const MedicalReportOutputSchema = z.object({
  summary: z.string().describe('AI-generated summary of the medical report'),
  keyFindings: z.array(z.string()).describe('Key findings from the report'),
  recommendations: z.string().describe('General recommendations based on the report'),
  disclaimer: z.string().describe('Medical disclaimer about the AI analysis'),
});

export type MedicalReportOutput = z.infer<typeof MedicalReportOutputSchema>;

const medicalReportPrompt = ai.definePrompt({
  name: 'medicalReportAnalysisPrompt',
  input: { schema: MedicalReportInputSchema },
  prompt: `You are MediBuddy, an AI assistant that helps analyze medical reports. You will be provided with an image of a medical report.

Please analyze the medical report image and provide:

1. A clear, comprehensive summary of the report in simple language
2. Key findings or abnormal values (if any)
3. General recommendations for follow-up or lifestyle considerations
4. Important disclaimers about AI analysis limitations

IMPORTANT GUIDELINES:
- You are NOT providing medical diagnosis or treatment advice
- Always emphasize that this is an AI analysis and NOT a substitute for professional medical consultation
- Recommend consulting with qualified healthcare professionals for proper interpretation
- Focus on explaining what the report shows in understandable terms
- If the image is unclear or not a medical report, politely indicate this
- Do not make definitive diagnostic statements
- Use encouraging and supportive language

${MedicalReportInputSchema.shape.patientQuestion ? 'Patient has asked: {{{patientQuestion}}}' : ''}

Please analyze this medical report image and provide your response in a helpful, educational manner while maintaining appropriate medical disclaimers.`,
});

const medicalReportFlow = ai.defineFlow(
  {
    name: 'medicalReportFlow',
    inputSchema: MedicalReportInputSchema,
    outputSchema: MedicalReportOutputSchema,
  },
  async (input: MedicalReportInput): Promise<MedicalReportOutput> => {
    try {
      // Create the media object for Gemini Vision
      const media = {
        contentType: input.mimeType,
        data: input.imageData,
      };

      const llmResponse = await medicalReportPrompt({
        imageData: input.imageData,
        mimeType: input.mimeType,
        patientQuestion: input.patientQuestion,
      }, {
        media: media,
      });

      const responseText = llmResponse.text || '';

      // Parse the response to extract structured information
      // This is a simplified approach - you might want to use more sophisticated parsing
      const lines = responseText.split('\n').filter(line => line.trim());
      
      let summary = '';
      let keyFindings: string[] = [];
      let recommendations = '';
      let currentSection = '';

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('summary') || lowerLine.includes('overview')) {
          currentSection = 'summary';
          continue;
        } else if (lowerLine.includes('key finding') || lowerLine.includes('findings')) {
          currentSection = 'findings';
          continue;
        } else if (lowerLine.includes('recommendation') || lowerLine.includes('suggest')) {
          currentSection = 'recommendations';
          continue;
        }

        if (currentSection === 'summary' && line.trim()) {
          summary += line + ' ';
        } else if (currentSection === 'findings' && line.trim()) {
          if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
            keyFindings.push(line.replace(/^[-•\d.]\s*/, '').trim());
          }
        } else if (currentSection === 'recommendations' && line.trim()) {
          recommendations += line + ' ';
        }
      }

      // If structured parsing didn't work well, use the full response as summary
      if (!summary.trim()) {
        summary = responseText;
      }

      const disclaimer = "⚠️ IMPORTANT: This AI analysis is for educational purposes only and should NOT be considered as medical advice, diagnosis, or treatment recommendation. Always consult with qualified healthcare professionals for proper medical interpretation and care decisions.";

      return {
        summary: summary.trim() || "I was able to process your medical report image. Please consult with a healthcare professional for detailed interpretation.",
        keyFindings: keyFindings.length > 0 ? keyFindings : ["Please consult with your healthcare provider for detailed findings"],
        recommendations: recommendations.trim() || "Please discuss these results with your healthcare provider for personalized recommendations.",
        disclaimer,
      };

    } catch (error) {
      console.error('Error analyzing medical report:', error);
      
      return {
        summary: "I encountered an issue while analyzing your medical report. This could be due to image quality or format limitations.",
        keyFindings: ["Unable to extract specific findings from the uploaded image"],
        recommendations: "Please ensure the image is clear and contains a readable medical report, then try again. For immediate concerns, contact your healthcare provider.",
        disclaimer: "⚠️ IMPORTANT: This AI analysis is for educational purposes only. Always consult with qualified healthcare professionals for medical advice.",
      };
    }
  }
);

export async function analyzeMedicalReport(input: MedicalReportInput): Promise<MedicalReportOutput> {
  return medicalReportFlow(input);
}
