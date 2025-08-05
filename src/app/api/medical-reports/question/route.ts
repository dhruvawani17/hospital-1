import { NextRequest, NextResponse } from 'next/server';

// Mock Q&A function for demo purposes when API key is not available
function createMockAnswer(question: string, documentId: string) {
  const questionLower = question.toLowerCase();
  
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
    const { question, reportText, documentId } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // For RAG system, we need documentId. If reportText is provided but no documentId,
    // it means the frontend is still using the old format
    if (!documentId && !reportText) {
      return NextResponse.json(
        { error: 'Document ID or report text is required' },
        { status: 400 }
      );
    }

    // Check if we have the required API key for RAG analysis
    const hasApiKey = process.env.OPENAI_API_KEY;
    
    if (!hasApiKey) {
      console.log('No OpenAI API key found, using mock Q&A for demo purposes');
      // Use mock Q&A when API key is not available
      const answer = createMockAnswer(question, documentId || 'demo');
      return NextResponse.json({ answer });
    }

    // Try to use RAG-based Q&A
    try {
      const { answerRagMedicalQuestion } = await import('@/ai/flows/ragMedicalReportFlow');
      
      // If we have documentId, use RAG Q&A
      if (documentId) {
        const result = await answerRagMedicalQuestion({ question, documentId });
        return NextResponse.json({ answer: result.answer });
      } else {
        // Fallback for old format - still provide a helpful response
        const answer = 'Please re-analyze your medical report first to enable RAG-based question answering. This will provide more accurate responses based on your specific document.';
        return NextResponse.json({ answer });
      }
    } catch (error) {
      console.warn('RAG Q&A failed, falling back to mock response:', error);
      // Fall back to mock Q&A if RAG fails
      const answer = createMockAnswer(question, documentId || 'demo');
      return NextResponse.json({ answer });
    }
  } catch (error) {
    console.error('Medical question answering error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question. Please try again.' },
      { status: 500 }
    );
  }
}