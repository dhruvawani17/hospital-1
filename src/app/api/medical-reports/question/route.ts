import { NextRequest, NextResponse } from 'next/server';

// Mock Q&A function for demo purposes when API key is not available
function createMockAnswer(question: string, reportText: string) {
  const questionLower = question.toLowerCase();
  const reportLower = reportText.toLowerCase();
  
  let fallbackAnswer = '';
  
  // Basic pattern matching for common questions
  if (questionLower.includes('concerning') || questionLower.includes('worried') || questionLower.includes('concern')) {
    fallbackAnswer = 'Based on your report, I understand your concerns. The best approach is to discuss these results with your healthcare provider who can provide personalized medical interpretation and guidance based on your complete medical history.';
  } else if (questionLower.includes('normal') || questionLower.includes('results')) {
    fallbackAnswer = 'Your report contains various test results. Some values may be within normal ranges while others might need attention. Please consult with your healthcare provider for a complete interpretation of all results in the context of your health.';
  } else if (questionLower.includes('mean') || questionLower.includes('explain')) {
    fallbackAnswer = 'Medical reports contain technical terms and values that are best explained by healthcare professionals. I recommend discussing the specific terms or values in your report with your doctor for accurate interpretation.';
  } else if (questionLower.includes('follow up') || questionLower.includes('next steps')) {
    fallbackAnswer = 'Follow-up care should be discussed with your healthcare provider based on your complete medical history and current results. They can recommend appropriate next steps and monitoring schedules.';
  } else {
    fallbackAnswer = 'I understand you have questions about your medical report. For the most accurate and safe medical interpretation, please discuss your specific questions with your healthcare provider. This demo system cannot provide specific medical advice.';
  }
  
  return fallbackAnswer + '\n\n*Note: This is a demonstration mode. For actual medical consultations, please speak with qualified healthcare professionals.*';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, reportText } = body;

    if (!question || !reportText) {
      return NextResponse.json(
        { error: 'Both question and report text are required' },
        { status: 400 }
      );
    }

    // Try OpenAI first (preferred), then Google AI, then mock Q&A
    const hasOpenAI = process.env.OPENAI_API_KEY;
    const hasGoogleAI = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (hasOpenAI) {
      console.log('Using OpenAI for medical Q&A');
      try {
        const { answerMedicalQuestionWithOpenAI } = await import('@/lib/openai-medical');
        const result = await answerMedicalQuestionWithOpenAI({ question, reportText });
        return NextResponse.json({ answer: result.answer });
      } catch (error) {
        console.warn('OpenAI Q&A failed, trying Google AI fallback:', error);
        // Fall through to Google AI
      }
    }
    
    if (hasGoogleAI) {
      console.log('Using Google AI for medical Q&A');
      try {
        const { answerMedicalQuestion } = await import('@/ai/flows/medicalReportFlow');
        const result = await answerMedicalQuestion({ question, reportText });
        return NextResponse.json({ answer: result.answer });
      } catch (error) {
        console.warn('Google AI Q&A failed, falling back to mock response:', error);
        // Fall through to mock Q&A
      }
    }
    
    // Use mock Q&A when no API keys are available or all AI services fail
    console.log('No AI services available, using mock Q&A for demo purposes');
    const answer = createMockAnswer(question, reportText);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Medical question answering error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question. Please try again.' },
      { status: 500 }
    );
  }
}