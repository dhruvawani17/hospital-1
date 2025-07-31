'use server';
/**
 * @fileOverview Medical Report Analysis AI Flow using OpenAI for medical report processing.
 * 
 * - `analyzeMedicalReport` - Analyzes medical reports and provides summaries
 * - `answerMedicalQuestion` - Answers questions about medical reports
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';

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

// Medical report analysis using OpenAI with enhanced error handling
async function analyzeWithOpenAI(reportText: string): Promise<{ summary: string; keyFindings: string[] }> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a medical AI assistant specialized in analyzing medical reports. Your role is to help patients understand their medical reports by providing clear, accurate summaries while being careful not to provide specific medical advice or diagnoses.

**Enhanced Analysis Instructions:**
1. Provide a detailed, comprehensive summary of the medical report in plain language that patients can understand
2. Extract ALL key findings, test results, abnormal values, diagnoses, recommendations, and important observations
3. Pay special attention to:
   - Specific numerical values and their reference ranges
   - Abnormal or concerning findings marked as "High", "Low", "Abnormal", etc.
   - Provider recommendations and follow-up instructions
   - Dates and timelines mentioned in the report
   - Patient demographics and test information
4. Explain medical terms in simple language when possible
5. Focus on factual information from the report without adding medical interpretation
6. If concerning findings are mentioned, suggest consulting with healthcare providers
7. Be empathetic and supportive in tone while remaining factual

**IMPORTANT MEDICAL DISCLAIMERS:**
- Always emphasize that this analysis is for informational purposes only
- Stress the importance of consulting healthcare professionals for medical decisions
- Do not provide specific medical advice or treatment recommendations
- Focus on explaining what the report says rather than interpreting medical significance

**Response Format Requirements:**
Please analyze the medical report thoroughly and provide your response as JSON with this exact structure:
{
  "summary": "A comprehensive, detailed summary of the medical report in plain language",
  "keyFindings": [
    "Specific finding 1 with relevant details",
    "Specific finding 2 with relevant details",
    "Provider recommendation or follow-up instruction",
    "Additional important observations"
  ]
}

Ensure the summary is comprehensive (200-400 words) and keyFindings includes 5-10 specific, actionable items extracted from the report.`
      },
      {
        role: "user",
        content: `Please provide a comprehensive analysis of this medical report:\n\n${reportText}`
      }
    ],
    temperature: 0.2, // Lower temperature for more consistent medical analysis
    max_tokens: 2500 // Increased for more detailed analysis
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(responseText);
    return {
      summary: parsed.summary || 'Medical report analysis completed.',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : []
    };
  } catch (parseError) {
    console.log('JSON parsing failed, extracting from text response:', parseError);
    
    // Fallback: extract summary and findings from text response
    const lines = responseText.split('\n').filter(line => line.trim());
    let summary = '';
    const keyFindings: string[] = [];
    
    let currentSection = '';
    let summaryLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('summary') || trimmed.toLowerCase().includes('overview')) {
        currentSection = 'summary';
        continue;
      } else if (trimmed.toLowerCase().includes('key finding') || 
                 trimmed.toLowerCase().includes('finding') ||
                 trimmed.toLowerCase().includes('important')) {
        currentSection = 'findings';
        continue;
      }
      
      if (currentSection === 'summary' && trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('•') && !trimmed.startsWith('*')) {
        summaryLines.push(trimmed);
      } else if ((currentSection === 'findings' || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && trimmed.length > 10) {
        const finding = trimmed.replace(/^[-•*]\s*/, '').trim();
        if (finding.length > 10) {
          keyFindings.push(finding);
        }
      } else if (!currentSection && trimmed.length > 20) {
        // If no section detected, treat longer lines as summary content
        summaryLines.push(trimmed);
      }
    }
    
    summary = summaryLines.join(' ').trim();
    
    // If we still don't have good content, use the entire response
    if (!summary && keyFindings.length === 0) {
      return {
        summary: responseText.trim(),
        keyFindings: ['Medical report analysis completed using AI interpretation']
      };
    }
    
    return {
      summary: summary || 'Medical report contains important health information that should be reviewed with your healthcare provider.',
      keyFindings: keyFindings.length > 0 ? keyFindings : ['Medical report processed successfully', 'Consult healthcare provider for detailed interpretation']
    };
  }
}

// Medical Q&A using OpenAI
async function answerQuestionWithOpenAI(question: string, reportText: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a medical AI assistant helping patients understand their medical reports. Answer the user's question based ONLY on the information provided in their medical report.

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

Please answer the patient's question based on their medical report.`
      },
      {
        role: "user",
        content: `Medical Report:\n${reportText}\n\nPatient's Question:\n${question}`
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  return responseText;
}

// Medical report analysis function
export async function analyzeMedicalReport(input: MedicalReportInput): Promise<MedicalReportOutput> {
  try {
    const { summary, keyFindings } = await analyzeWithOpenAI(input.reportText);
    
    return {
      summary,
      keyFindings,
      reportText: input.reportText,
    };
  } catch (error) {
    // Provide enhanced fallback response when OpenAI API is not available
    console.warn('OpenAI analysis failed, providing enhanced content-based fallback:', error);
    
    // Use the same enhanced content-based analysis as in the API route
    const reportText = input.reportText.toLowerCase();
    const lines = input.reportText.split('\n').filter(line => line.trim().length > 3);
    const words = input.reportText.split(/\s+/).filter(word => word.length > 2);
    
    const findings: string[] = [];
    let summary = '';
    
    // Extract specific values and measurements (same logic as API route)
    const extractMedicalValues = (text: string) => {
      const patterns = {
        bloodPressure: /(\d{2,3}\/\d{2,3})\s*mmhg/gi,
        cholesterol: /cholesterol[:\s]*(\d+)/gi,
        glucose: /glucose[:\s]*(\d+)/gi,
        hemoglobin: /h[ae]moglobin[:\s]*(\d+\.?\d*)/gi,
        heartRate: /heart rate[:\s]*(\d+)/gi,
        temperature: /temp(?:erature)?[:\s]*(\d+\.?\d*)/gi,
        weight: /weight[:\s]*(\d+\.?\d*)/gi,
        dates: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
        abnormalFlags: /\b(high|low|elevated|decreased|abnormal|critical|urgent)\b/gi
      };
      
      const results: any = {};
      for (const [key, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          results[key] = matches;
        }
      }
      return results;
    };
    
    const medicalValues = extractMedicalValues(input.reportText);
    
    // Analyze content based on actual extracted data
    if (medicalValues.bloodPressure && medicalValues.bloodPressure.length > 0) {
      findings.push(`Blood pressure readings found: ${medicalValues.bloodPressure.join(', ')}`);
    }
    
    if (medicalValues.cholesterol && medicalValues.cholesterol.length > 0) {
      findings.push(`Cholesterol levels documented: ${medicalValues.cholesterol.join(', ')}`);
    }
    
    if (medicalValues.glucose && medicalValues.glucose.length > 0) {
      findings.push(`Blood glucose measurements: ${medicalValues.glucose.join(', ')}`);
    }
    
    if (medicalValues.hemoglobin && medicalValues.hemoglobin.length > 0) {
      findings.push(`Hemoglobin levels recorded: ${medicalValues.hemoglobin.join(', ')}`);
    }
    
    if (medicalValues.abnormalFlags && medicalValues.abnormalFlags.length > 0) {
      const uniqueFlags = [...new Set(medicalValues.abnormalFlags.map((f: string) => f.toLowerCase()))];
      findings.push(`Abnormal indicators noted: ${uniqueFlags.join(', ')}`);
    }
    
    // Look for specific medical departments/tests
    const medicalSections = {
      'laboratory': /lab(?:oratory)?|blood test|urine test|specimen/gi,
      'cardiology': /heart|cardiac|ecg|ekg|chest pain/gi,
      'endocrine': /diabetes|thyroid|hormone|insulin/gi,
      'hematology': /blood count|cbc|wbc|rbc|platelet/gi,
      'chemistry': /metabolic panel|liver function|kidney function/gi
    };
    
    for (const [section, pattern] of Object.entries(medicalSections)) {
      if (pattern.test(input.reportText)) {
        findings.push(`${section.charAt(0).toUpperCase() + section.slice(1)} testing/evaluation documented`);
      }
    }
    
    // Extract doctor recommendations if present
    const recommendationPatterns = [
      /recommend(?:ed|ation)[s]?[:\s]*([^\.]+)/gi,
      /follow[- ]?up[:\s]*([^\.]+)/gi,
      /continue[:\s]*([^\.]+)/gi,
      /discontinue[:\s]*([^\.]+)/gi
    ];
    
    recommendationPatterns.forEach(pattern => {
      const matches = input.reportText.match(pattern);
      if (matches && matches.length > 0) {
        matches.slice(0, 3).forEach(match => {
          findings.push(`Provider recommendation: ${match.trim()}`);
        });
      }
    });
    
    // Generate contextual summary based on content
    const contentLength = input.reportText.length;
    const hasNumericValues = /\d+\.?\d*\s*(mg\/dl|mmhg|bpm|°f|°c|%)/gi.test(input.reportText);
    const hasDateInfo = medicalValues.dates && medicalValues.dates.length > 0;
    
    if (contentLength > 500) {
      summary = `This comprehensive medical report (${contentLength} characters) contains detailed clinical information`;
      if (hasNumericValues) summary += ' with specific laboratory values and measurements';
      if (hasDateInfo) summary += ` from ${medicalValues.dates.length} documented date(s)`;
      summary += '. ';
    } else if (contentLength > 100) {
      summary = `This medical report contains clinical information and test results`;
      if (hasNumericValues) summary += ' with measurable values';
      summary += '. ';
    } else {
      summary = 'This appears to be a brief medical summary or excerpt. ';
    }
    
    if (findings.length > 3) {
      summary += `Multiple clinical findings are documented including ${findings.length} specific observations. `;
    } else if (findings.length > 0) {
      summary += `Several clinical findings are documented. `;
    }
    
    summary += 'Please review these findings with your healthcare provider for proper medical interpretation and any necessary follow-up actions.';
    
    // Ensure we have meaningful findings
    if (findings.length === 0) {
      findings.push('Medical document processed successfully');
      findings.push(`Document contains ${words.length} words across ${lines.length} lines`);
      if (hasNumericValues) {
        findings.push('Numerical measurements and values are present in the report');
      }
    }
    
    // Add API failure notice
    findings.push('⚠️ Enhanced content-based analysis (OpenAI unavailable)');
    
    return {
      summary: summary || 'Medical report processed successfully using enhanced content analysis. Please consult your healthcare provider for accurate medical interpretation.',
      keyFindings: findings,
      reportText: input.reportText,
    };
  }
}

// Medical Q&A function
export async function answerMedicalQuestion(input: MedicalQuestionInput): Promise<MedicalQuestionOutput> {
  try {
    const answer = await answerQuestionWithOpenAI(input.question, input.reportText);
    
    return {
      answer,
    };
  } catch (error) {
    // Provide a fallback response when OpenAI API is not available
    console.warn('OpenAI Q&A failed, providing fallback response:', error);
    
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