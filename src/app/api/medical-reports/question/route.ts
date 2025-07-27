import { NextRequest, NextResponse } from 'next/server';
import { answerMedicalQuestion } from '@/ai/flows/medicalReportFlow';

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

    const answer = await answerMedicalQuestion({ question, reportText });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Medical question answering error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question. Please try again.' },
      { status: 500 }
    );
  }
}