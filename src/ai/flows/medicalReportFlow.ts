'use server';
/**
 * @fileOverview Medical Report Analysis AI Flow using Gemini for medical report processing.
 * 
 * - `analyzeMedicalReport` - Analyzes medical reports and provides summaries
 * - `answerMedicalQuestion` - Answers questions about medical reports
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input/Output schemas for medical report analysis
const MedicalReportInputSchema = z.object({
  reportText: z.string().describe('The medical report text to analyze.'),
});
export type MedicalReportInput = z.infer<typeof MedicalReportInputSchema>;

const MedicalReportOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the medical report.'),
  keyFindings: z.array(z.string()).describe('Key findings, test results, and important observations from the report.'),
  reportText: z.string().describe('The original report text for reference.'),
});
export type MedicalReportOutput = z.infer<typeof MedicalReportOutputSchema>;

// Input/Output schemas for medical Q&A
const MedicalQuestionInputSchema = z.object({
  question: z.string().describe('The question about the medical report.'),
  reportText: z.string().describe('The medical report text to reference.'),
});
export type MedicalQuestionInput = z.infer<typeof MedicalQuestionInputSchema>;

const MedicalQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the medical question based on the report.'),
});
export type MedicalQuestionOutput = z.infer<typeof MedicalQuestionOutputSchema>;

// Medical report analysis prompt
const medicalAnalysisPrompt = ai.definePrompt({
  name: 'medicalReportAnalysisPrompt',
  input: { schema: MedicalReportInputSchema },
  prompt: `You are a medical AI assistant specialized in analyzing medical reports. Your role is to help patients understand their medical reports by providing clear, accurate summaries while being careful not to provide specific medical advice or diagnoses.

**Medical Report to Analyze:**
{{{reportText}}}

**Instructions:**
1. Provide a clear, comprehensive summary of the medical report in plain language that patients can understand
2. Extract key findings, test results, abnormal values, diagnoses, recommendations, and important observations
3. Explain medical terms in simple language when possible
4. Focus on factual information from the report
5. Do NOT provide medical advice, treatment recommendations, or diagnoses beyond what's stated in the report
6. If concerning findings are mentioned, suggest consulting with healthcare providers
7. Be empathetic and supportive in tone

**IMPORTANT MEDICAL DISCLAIMERS:**
- Always emphasize that this analysis is for informational purposes only
- Stress the importance of consulting healthcare professionals for medical decisions
- Do not provide specific medical advice or treatment recommendations
- Focus on explaining what the report says rather than interpreting medical significance

Please analyze this medical report and provide a summary with key findings.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

// Medical Q&A prompt
const medicalQuestionPrompt = ai.definePrompt({
  name: 'medicalQuestionPrompt',
  input: { schema: MedicalQuestionInputSchema },
  prompt: `You are a medical AI assistant helping patients understand their medical reports. Answer the user's question based ONLY on the information provided in their medical report.

**Medical Report:**
{{{reportText}}}

**Patient's Question:**
{{{question}}}

**Instructions:**
1. Answer the question based ONLY on information available in the medical report
2. Use clear, simple language that patients can understand
3. Explain medical terms when they appear in the report
4. If the report doesn't contain information to answer the question, clearly state this
5. Do NOT provide medical advice, diagnoses, or treatment recommendations beyond what's in the report
6. If the question involves concerning symptoms or requires medical judgment, advise consulting a healthcare provider
7. Be supportive and empathetic in your response

**CRITICAL SAFETY GUIDELINES:**
- Only reference information explicitly stated in the provided report
- Do not provide medical advice or treatment recommendations
- Encourage consultation with healthcare providers for medical decisions
- If asked about concerning findings, emphasize the need for professional medical consultation
- Never attempt to diagnose conditions or suggest treatments

Please answer the patient's question based on their medical report.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

// Medical report analysis flow
const medicalReportAnalysisFlow = ai.defineFlow(
  {
    name: 'medicalReportAnalysis',
    inputSchema: MedicalReportInputSchema,
    outputSchema: MedicalReportOutputSchema,
  },
  async (input: MedicalReportInput): Promise<MedicalReportOutput> => {
    try {
      const llmResponse = await medicalAnalysisPrompt(input);
      
      if (!llmResponse.text) {
        throw new Error('Failed to generate medical report analysis');
      }

      // Parse the response to extract summary and key findings
      const responseText = llmResponse.text;
      
      // Try to extract structured information from the response
      let summary = '';
      let keyFindings: string[] = [];
      
      // Simple parsing - in production, you might want more sophisticated parsing
      const lines = responseText.split('\n').filter(line => line.trim());
      
      let currentSection = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes('summary') || trimmed.toLowerCase().includes('overview')) {
          currentSection = 'summary';
          continue;
        } else if (trimmed.toLowerCase().includes('key finding') || trimmed.toLowerCase().includes('finding')) {
          currentSection = 'findings';
          continue;
        }
        
        if (currentSection === 'summary' && trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
          summary += (summary ? ' ' : '') + trimmed;
        } else if (currentSection === 'findings' && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
          keyFindings.push(trimmed.replace(/^[-•]\s*/, ''));
        }
      }
      
      // If parsing fails, use the full response as summary
      if (!summary) {
        summary = responseText;
      }
      
      // If no structured findings found, try to extract bullet points
      if (keyFindings.length === 0) {
        const bulletPoints = responseText.match(/[-•]\s*([^\n]+)/g);
        if (bulletPoints) {
          keyFindings = bulletPoints.map(point => point.replace(/^[-•]\s*/, ''));
        }
      }

      return {
        summary: summary || 'Medical report analysis completed. Please review the findings below.',
        keyFindings,
        reportText: input.reportText,
      };
    } catch (error) {
      // Provide a fallback response when API is not available (e.g., missing API key)
      console.warn('AI analysis failed, providing fallback response:', error);
      
      // Extract basic information from the report text for a mock analysis
      const reportText = input.reportText.toLowerCase();
      const mockFindings: string[] = [];
      let mockSummary = '';
      
      // Basic pattern matching for common medical terms
      if (reportText.includes('cholesterol')) {
        if (reportText.includes('borderline') || reportText.includes('high')) {
          mockFindings.push('Cholesterol levels are elevated and may require dietary modifications');
        }
        mockFindings.push('Lipid profile shows cholesterol measurements outside normal ranges');
      }
      
      if (reportText.includes('blood pressure') || reportText.includes('mmhg')) {
        mockFindings.push('Blood pressure readings noted in the report');
      }
      
      if (reportText.includes('glucose') || reportText.includes('blood sugar')) {
        mockFindings.push('Blood glucose levels measured and documented');
      }
      
      if (reportText.includes('hemoglobin') || reportText.includes('blood count')) {
        mockFindings.push('Complete blood count (CBC) results available');
      }
      
      if (reportText.includes('recommendation')) {
        mockFindings.push('Healthcare provider recommendations included in report');
      }
      
      // Generate a basic summary
      if (reportText.includes('normal') && reportText.includes('recommendation')) {
        mockSummary = 'This medical report contains laboratory test results with some values in normal ranges and others requiring attention. The healthcare provider has included specific recommendations for follow-up care and lifestyle modifications.';
      } else {
        mockSummary = 'This medical report contains various test results and clinical findings. Please consult with your healthcare provider to discuss the results and any necessary follow-up actions.';
      }
      
      // Add standard disclaimer
      mockFindings.push('This is a demo analysis. For accurate medical interpretation, please consult your healthcare provider');
      
      return {
        summary: mockSummary || 'Medical report processed successfully. This is a demonstration mode - please consult your healthcare provider for accurate medical interpretation.',
        keyFindings: mockFindings.length > 0 ? mockFindings : [
          'Medical report contains test results and clinical information',
          'Healthcare provider consultation recommended for proper interpretation',
          'This is a demonstration of the AI medical report analysis feature'
        ],
        reportText: input.reportText,
      };
    }
  }
);

// Medical Q&A flow
const medicalQuestionFlow = ai.defineFlow(
  {
    name: 'medicalQuestionAnswer',
    inputSchema: MedicalQuestionInputSchema,
    outputSchema: MedicalQuestionOutputSchema,
  },
  async (input: MedicalQuestionInput): Promise<MedicalQuestionOutput> => {
    try {
      const llmResponse = await medicalQuestionPrompt(input);
      
      if (!llmResponse.text) {
        throw new Error('Failed to generate answer to medical question');
      }

      return {
        answer: llmResponse.text,
      };
    } catch (error) {
      // Provide a fallback response when API is not available
      console.warn('AI Q&A failed, providing fallback response:', error);
      
      const question = input.question.toLowerCase();
      const reportText = input.reportText.toLowerCase();
      
      let fallbackAnswer = '';
      
      // Basic pattern matching for common questions
      if (question.includes('concerning') || question.includes('worried') || question.includes('concern')) {
        fallbackAnswer = 'Based on your report, I understand your concerns. The best approach is to discuss these results with your healthcare provider who can provide personalized medical interpretation and guidance based on your complete medical history.';
      } else if (question.includes('normal') || question.includes('results')) {
        fallbackAnswer = 'Your report contains various test results. Some values may be within normal ranges while others might need attention. Please consult with your healthcare provider for a complete interpretation of all results in the context of your health.';
      } else if (question.includes('mean') || question.includes('explain')) {
        fallbackAnswer = 'Medical reports contain technical terms and values that are best explained by healthcare professionals. I recommend discussing the specific terms or values in your report with your doctor for accurate interpretation.';
      } else if (question.includes('follow up') || question.includes('next steps')) {
        fallbackAnswer = 'Follow-up care should be discussed with your healthcare provider based on your complete medical history and current results. They can recommend appropriate next steps and monitoring schedules.';
      } else {
        fallbackAnswer = 'I understand you have questions about your medical report. For the most accurate and safe medical interpretation, please discuss your specific questions with your healthcare provider. This demo system cannot provide specific medical advice.';
      }
      
      return {
        answer: fallbackAnswer + '\n\n*Note: This is a demonstration mode. For actual medical consultations, please speak with qualified healthcare professionals.*',
      };
    }
  }
);

// Exported functions
export async function analyzeMedicalReport(input: MedicalReportInput): Promise<MedicalReportOutput> {
  return medicalReportAnalysisFlow(input);
}

export async function answerMedicalQuestion(input: MedicalQuestionInput): Promise<MedicalQuestionOutput> {
  return medicalQuestionFlow(input);
}