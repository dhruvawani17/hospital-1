import { NextRequest, NextResponse } from 'next/server';
import { analyzeMedicalReport } from '@/ai/flows/medicalReportFlow';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;

    if (!file && !text) {
      return NextResponse.json(
        { error: 'Either file or text must be provided' },
        { status: 400 }
      );
    }

    let reportText = '';

    // Extract text from file if provided
    if (file) {
      if (file.type === 'application/pdf') {
        // For PDF files, we'll handle them as text for now
        // In a production environment, you'd use a PDF parser library
        reportText = await file.text();
      } else if (file.type.startsWith('image/')) {
        // For images, in a production environment, you'd use OCR
        // For now, we'll return an error asking for text input
        return NextResponse.json(
          { error: 'Image OCR not implemented. Please copy the text from your image and paste it in the text area instead.' },
          { status: 400 }
        );
      } else if (file.type.startsWith('text/') || 
                 file.type === 'application/msword' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        reportText = await file.text();
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        );
      }
    } else if (text) {
      reportText = text;
    }

    if (!reportText.trim()) {
      return NextResponse.json(
        { error: 'No text content found in the provided input' },
        { status: 400 }
      );
    }

    // Analyze the report using AI
    const analysis = await analyzeMedicalReport({ reportText });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Medical report analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze medical report. Please try again.' },
      { status: 500 }
    );
  }
}