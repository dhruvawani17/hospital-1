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
1. **Comprehensive Analysis**: Carefully analyze ALL sections of the medical report including:
   - Patient demographics and test dates
   - Laboratory values and their reference ranges
   - Diagnostic imaging results
   - Clinical observations and findings
   - Healthcare provider recommendations
   - Medication information if present

2. **Clear Summary**: Provide a structured summary that includes:
   - Overview of what tests/examinations were performed
   - Key findings with their clinical significance
   - Values that are outside normal ranges (specify if high, low, or borderline)
   - Any diagnoses or conditions mentioned
   - Treatment recommendations or follow-up instructions

3. **Patient-Friendly Language**: 
   - Explain medical terminology in simple terms
   - Use percentages or analogies when helpful
   - Avoid jargon while maintaining accuracy
   - Be empathetic and supportive in tone

4. **Structured Key Findings**: Extract specific findings such as:
   - Abnormal lab values with context (e.g., "Cholesterol 245 mg/dL - High (normal <200)")
   - Important measurements (blood pressure, glucose, etc.)
   - Recommendations from healthcare providers
   - Any urgent or concerning findings
   - Follow-up requirements

5. **Safety Guidelines**:
   - Focus on factual information from the report
   - Do NOT provide medical advice or treatment recommendations beyond what's stated
   - If concerning findings are mentioned, emphasize consulting healthcare providers
   - Always include appropriate medical disclaimers

**IMPORTANT MEDICAL DISCLAIMERS:**
- This analysis is for informational and educational purposes only
- Always consult with qualified healthcare professionals for medical decisions
- Do not use this analysis as a substitute for professional medical advice
- Contact your healthcare provider for questions about your results

Please provide a comprehensive analysis that helps the patient understand their medical report while maintaining appropriate medical safety standards.`,
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

      // Parse the response to extract summary and key findings with better structure
      const responseText = llmResponse.text;
      
      // Enhanced parsing to extract structured information from the response
      let summary = '';
      let keyFindings: string[] = [];
      
      // Split response into sections for better parsing
      const sections = responseText.split(/\n\s*\n/);
      let currentSection = '';
      
      for (const section of sections) {
        const lines = section.split('\n').map(line => line.trim()).filter(line => line);
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lowerLine = line.toLowerCase();
          
          // Identify section headers
          if (lowerLine.includes('summary') || lowerLine.includes('overview')) {
            currentSection = 'summary';
            continue;
          } else if (lowerLine.includes('key finding') || lowerLine.includes('findings') || 
                     lowerLine.includes('important') || lowerLine.includes('results')) {
            currentSection = 'findings';
            continue;
          } else if (lowerLine.includes('recommendation') || lowerLine.includes('follow-up')) {
            currentSection = 'findings'; // Include recommendations in findings
            continue;
          }
          
          // Process content based on current section
          if (currentSection === 'summary' && line && !line.startsWith('-') && !line.startsWith('•')) {
            // Build summary from non-bullet content
            summary += (summary ? ' ' : '') + line;
          } else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
            // Extract bullet points as findings
            const finding = line.replace(/^[-•*]\s*/, '').trim();
            if (finding && finding.length > 10) {
              keyFindings.push(finding);
            }
          } else if (currentSection === 'findings' && line && !line.includes(':') && line.length > 15) {
            // Extract non-bullet findings that seem important
            keyFindings.push(line);
          }
        }
      }
      
      // If structured parsing didn't work well, use fallback extraction
      if (!summary || summary.length < 50) {
        // Extract the first substantial paragraph as summary
        const paragraphs = responseText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        if (paragraphs.length > 0) {
          summary = paragraphs[0].replace(/\n/g, ' ').trim();
        }
      }
      
      // Enhanced bullet point extraction
      if (keyFindings.length < 3) {
        const allBullets = responseText.match(/[-•*]\s*([^\n]+)/g);
        if (allBullets) {
          keyFindings = allBullets.map(bullet => bullet.replace(/^[-•*]\s*/, '').trim())
                                 .filter(finding => finding.length > 10)
                                 .slice(0, 10); // Limit to reasonable number
        }
      }
      
      // Look for specific medical findings patterns
      const medicalPatterns = [
        /(\w+(?:\s+\w+)*)\s*:\s*([0-9.]+\s*[a-zA-Z/%]+)\s*\([^)]*\)/g,
        /(blood pressure|cholesterol|glucose|hemoglobin).*?(?:\d+[\/\-]?\d*|\b(?:high|low|normal|elevated|borderline)\b)/gi,
        /recommendation.*?[:.]([^.]+)/gi
      ];
      
      medicalPatterns.forEach(pattern => {
        const matches = responseText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleanMatch = match.trim();
            if (cleanMatch.length > 15 && !keyFindings.some(f => f.includes(cleanMatch.substring(0, 20)))) {
              keyFindings.push(cleanMatch);
            }
          });
        }
      });

      return {
        summary: summary || 'Medical report analysis completed. Please review the findings below.',
        keyFindings,
        reportText: input.reportText,
      };
    } catch (error) {
      // Provide a fallback response when API is not available (e.g., missing API key)
      console.warn('AI analysis failed, providing fallback response:', error);
      
      // Extract basic information from the report text for a more sophisticated mock analysis
      const reportText = input.reportText.toLowerCase();
      const originalText = input.reportText;
      const mockFindings: string[] = [];
      let mockSummary = '';
      
      // Enhanced pattern matching for medical terms and values
      const labResults: string[] = [];
      const recommendations: string[] = [];
      const abnormalFindings: string[] = [];
      
      // Extract numeric values with units (lab results)
      const labPatterns = [
        /(?:cholesterol|ldl|hdl|triglycerides?).*?(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/gi,
        /(?:glucose|blood sugar).*?(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)/gi,
        /(?:blood pressure|bp).*?(\d+\/\d+)\s*mmhg/gi,
        /(?:hemoglobin|hgb).*?(\d+(?:\.\d+)?)\s*(g\/dl)/gi,
        /(?:creatinine).*?(\d+(?:\.\d+)?)\s*(mg\/dl)/gi
      ];
      
      labPatterns.forEach(pattern => {
        const matches = [...originalText.matchAll(pattern)];
        matches.forEach(match => {
          labResults.push(match[0].trim());
        });
      });
      
      // Extract recommendations
      const recPatterns = [
        /recommend(?:ation|s)?[:\s]([^.]+)/gi,
        /follow[-\s]?up[:\s]([^.]+)/gi,
        /advise[:\s]([^.]+)/gi
      ];
      
      recPatterns.forEach(pattern => {
        const matches = [...originalText.matchAll(pattern)];
        matches.forEach(match => {
          const rec = match[1].trim();
          if (rec.length > 5 && rec.length < 200) {
            recommendations.push(rec);
          }
        });
      });
      
      // Analyze content for specific medical conditions
      if (reportText.includes('cholesterol')) {
        if (reportText.includes('high') || reportText.includes('elevated') || /cholesterol.*?2[4-9]\d|[3-9]\d\d/i.test(originalText)) {
          abnormalFindings.push('Elevated cholesterol levels detected - may require dietary modifications and lifestyle changes');
          mockFindings.push('Lipid panel shows cholesterol values above recommended ranges');
        } else if (reportText.includes('borderline')) {
          abnormalFindings.push('Borderline cholesterol levels - monitoring and lifestyle modifications recommended');
        } else {
          mockFindings.push('Cholesterol levels documented in lipid profile');
        }
      }
      
      if (reportText.includes('blood pressure') || reportText.includes('mmhg')) {
        if (/1[4-9]\d\/[89]\d|1[5-9]\d\/9\d/i.test(originalText)) {
          abnormalFindings.push('Blood pressure readings indicate hypertension - medical evaluation recommended');
        } else {
          mockFindings.push('Blood pressure measurements recorded');
        }
      }
      
      if (reportText.includes('glucose') || reportText.includes('blood sugar')) {
        if (/glucose.*?1[1-9]\d|[2-9]\d\d/i.test(originalText)) {
          abnormalFindings.push('Elevated glucose levels - may indicate diabetes risk or blood sugar management issues');
        } else {
          mockFindings.push('Blood glucose levels within documented ranges');
        }
      }
      
      if (reportText.includes('hemoglobin') || reportText.includes('blood count') || reportText.includes('cbc')) {
        mockFindings.push('Complete blood count (CBC) results available showing blood cell measurements');
      }
      
      if (reportText.includes('kidney') || reportText.includes('creatinine') || reportText.includes('bun')) {
        mockFindings.push('Kidney function tests documented');
      }
      
      if (reportText.includes('liver') || reportText.includes('alt') || reportText.includes('ast')) {
        mockFindings.push('Liver function test results included');
      }
      
      // Include extracted lab results
      if (labResults.length > 0) {
        mockFindings.push(`Laboratory values documented: ${labResults.slice(0, 3).join(', ')}`);
      }
      
      // Include recommendations
      if (recommendations.length > 0) {
        recommendations.slice(0, 2).forEach(rec => {
          mockFindings.push(`Healthcare provider recommendation: ${rec}`);
        });
      }
      
      // Include abnormal findings
      abnormalFindings.forEach(finding => {
        mockFindings.push(finding);
      });
      
      // Generate a comprehensive summary based on content analysis
      const hasAbnormal = abnormalFindings.length > 0;
      const hasRecommendations = recommendations.length > 0;
      const hasLabResults = labResults.length > 0;
      
      if (hasAbnormal && hasRecommendations) {
        mockSummary = `This medical report contains comprehensive laboratory results with some values outside normal ranges requiring attention. The healthcare provider has included specific recommendations for follow-up care, lifestyle modifications, and potential treatment options. Key areas of focus include ${hasLabResults ? 'measured lab values' : 'clinical findings'} that warrant monitoring and possible intervention.`;
      } else if (hasLabResults) {
        mockSummary = `This medical report documents various laboratory test results and clinical measurements. The report includes standard medical assessments with documented values and ranges. Regular monitoring and consultation with healthcare providers is recommended for optimal health management.`;
      } else if (hasRecommendations) {
        mockSummary = `This medical report contains clinical observations and healthcare provider recommendations for ongoing care. The document outlines specific guidance for health management and follow-up procedures.`;
      } else {
        mockSummary = `This medical report contains clinical information and test results. The document provides medical data that should be reviewed with a healthcare provider for proper interpretation and guidance on any necessary follow-up actions.`;
      }
      
      // Add standard disclaimer
      mockFindings.push('⚠️ This analysis is provided in demonstration mode - for accurate medical interpretation, please consult your healthcare provider');
      
      return {
        summary: mockSummary,
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