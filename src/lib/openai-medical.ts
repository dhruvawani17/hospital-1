/**
 * OpenAI-based medical report analysis service
 * Provides medical report analysis and Q&A using OpenAI's GPT models
 */

import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No OpenAI API key found in environment variables');
      return null;
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

// Types for medical report analysis
export interface MedicalReportInput {
  reportText: string;
}

export interface MedicalReportOutput {
  summary: string;
  keyFindings: string[];
  reportText: string;
}

export interface MedicalQuestionInput {
  question: string;
  reportText: string;
}

export interface MedicalQuestionOutput {
  answer: string;
}

/**
 * Analyze a medical report using OpenAI
 */
export async function analyzeMedicalReportWithOpenAI(
  input: MedicalReportInput
): Promise<MedicalReportOutput> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI client not available');
  }

  const prompt = `You are a medical AI assistant specialized in analyzing medical reports. Your role is to help patients understand their medical reports by providing clear, accurate summaries while being careful not to provide specific medical advice or diagnoses.

**Medical Report to Analyze:**
${input.reportText}

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

Please provide your response in the following format:

SUMMARY:
[Provide a comprehensive summary in plain language]

KEY FINDINGS:
- [Key finding 1]
- [Key finding 2]
- [Key finding 3]
[Continue with additional findings as needed]

Please analyze this medical report and provide a summary with key findings.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o mini for cost efficiency while maintaining quality
      messages: [
        {
          role: "system",
          content: "You are a helpful medical AI assistant that helps patients understand their medical reports. Always provide safe, informative responses and emphasize the importance of consulting healthcare professionals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent medical analysis
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    if (!responseText) {
      throw new Error('No response received from OpenAI');
    }

    // Parse the response to extract summary and key findings
    let summary = '';
    let keyFindings: string[] = [];
    
    const lines = responseText.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = '';
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      
      if (upperLine.includes('SUMMARY:')) {
        currentSection = 'summary';
        // If there's text after "SUMMARY:", include it
        const summaryText = line.replace(/SUMMARY:\s*/i, '').trim();
        if (summaryText) {
          summary = summaryText;
        }
        continue;
      } else if (upperLine.includes('KEY FINDINGS:') || upperLine.includes('KEY FINDING:')) {
        currentSection = 'findings';
        continue;
      }
      
      if (currentSection === 'summary' && line) {
        summary += (summary ? ' ' : '') + line;
      } else if (currentSection === 'findings' && line.startsWith('-')) {
        keyFindings.push(line.replace(/^-\s*/, ''));
      } else if (currentSection === 'findings' && line.match(/^\d+\./)) {
        keyFindings.push(line.replace(/^\d+\.\s*/, ''));
      }
    }
    
    // If parsing fails, try to extract basic information
    if (!summary || keyFindings.length === 0) {
      const fallbackSummary = responseText.split('\n').slice(0, 3).join(' ').trim();
      const bulletPoints = responseText.match(/[-•]\s*([^\n]+)/g) || [];
      
      summary = summary || fallbackSummary || 'Medical report analysis completed. Please review the findings below.';
      keyFindings = keyFindings.length > 0 ? keyFindings : bulletPoints.map(point => point.replace(/^[-•]\s*/, ''));
    }
    
    return {
      summary: summary || 'Medical report analysis completed using OpenAI. Please review the findings below.',
      keyFindings: keyFindings.length > 0 ? keyFindings : [
        'Medical report processed successfully with OpenAI',
        'Please consult your healthcare provider for proper interpretation',
        'This analysis is for informational purposes only'
      ],
      reportText: input.reportText,
    };
    
  } catch (error) {
    console.error('OpenAI medical analysis error:', error);
    throw new Error('Failed to analyze medical report with OpenAI');
  }
}

/**
 * Answer a question about a medical report using OpenAI
 */
export async function answerMedicalQuestionWithOpenAI(
  input: MedicalQuestionInput
): Promise<MedicalQuestionOutput> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI client not available');
  }

  const prompt = `You are a medical AI assistant helping patients understand their medical reports. Answer the user's question based ONLY on the information provided in their medical report.

**Medical Report:**
${input.reportText}

**Patient's Question:**
${input.question}

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

Please answer the patient's question based on their medical report.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o mini for consistency
      messages: [
        {
          role: "system",
          content: "You are a helpful medical AI assistant that answers questions about medical reports. Always provide safe responses based only on the information in the report and emphasize the importance of consulting healthcare professionals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3, // Lower temperature for consistent medical responses
    });

    const answer = completion.choices[0]?.message?.content || '';
    
    if (!answer) {
      throw new Error('No response received from OpenAI');
    }

    return {
      answer: answer.trim(),
    };
    
  } catch (error) {
    console.error('OpenAI medical Q&A error:', error);
    throw new Error('Failed to answer question with OpenAI');
  }
}

/**
 * Check if OpenAI is available
 */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}