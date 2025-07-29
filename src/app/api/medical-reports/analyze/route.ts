import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

// Extract text from PDF using pdf-parse
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(Buffer.from(pdfBuffer));
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the PDF contains readable text.');
  }
}

// Extract text from image using Tesseract.js OCR
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  let worker;
  try {
    console.log('Starting OCR processing with Tesseract.js');
    
    // Create Tesseract worker
    worker = await createWorker();
    
    // Initialize with English language
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Configure for better medical text recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/()-+ ',
      preserve_interword_spaces: '1',
    });
    
    // Process the image
    const { data: { text } } = await worker.recognize(Buffer.from(imageBuffer));
    
    console.log('OCR completed successfully');
    return text.trim();
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to extract text from image. Please ensure the image contains clear, readable text.');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

// Mock analysis function for demo purposes when API key is not available
function createMockAnalysis(reportText: string) {
  const reportLower = reportText.toLowerCase();
  const mockFindings: string[] = [];
  let mockSummary = '';
  
  // Basic pattern matching for common medical terms
  if (reportLower.includes('cholesterol')) {
    if (reportLower.includes('borderline') || reportLower.includes('high')) {
      mockFindings.push('Cholesterol levels are elevated and may require dietary modifications');
    }
    mockFindings.push('Lipid profile shows cholesterol measurements outside normal ranges');
  }
  
  if (reportLower.includes('blood pressure') || reportLower.includes('mmhg')) {
    mockFindings.push('Blood pressure readings noted in the report');
  }
  
  if (reportLower.includes('glucose') || reportLower.includes('blood sugar')) {
    mockFindings.push('Blood glucose levels measured and documented');
  }
  
  if (reportLower.includes('hemoglobin') || reportLower.includes('blood count')) {
    mockFindings.push('Complete blood count (CBC) results available');
  }
  
  if (reportLower.includes('recommendation')) {
    mockFindings.push('Healthcare provider recommendations included in report');
  }
  
  // Generate a basic summary
  if (reportLower.includes('normal') && reportLower.includes('recommendation')) {
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
    reportText: reportText,
  };
}

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
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      if (file.type === 'application/pdf') {
        try {
          console.log('Starting PDF text extraction');
          const buffer = await file.arrayBuffer();
          reportText = await extractTextFromPDF(buffer);
          console.log('PDF processing completed, extracted text length:', reportText.length);
          
          if (!reportText.trim()) {
            return NextResponse.json(
              { error: 'No text could be extracted from the PDF. Please ensure the PDF contains readable text or try uploading as an image.' },
              { status: 400 }
            );
          }
        } catch (pdfError) {
          console.error('PDF processing failed:', pdfError);
          return NextResponse.json(
            { error: pdfError instanceof Error ? pdfError.message : 'Failed to process PDF file. Please try again or copy the text manually.' },
            { status: 400 }
          );
        }
      } else if (file.type.startsWith('image/')) {
        try {
          console.log('Starting OCR processing for image:', file.name);
          
          // Convert file to buffer for OCR processing
          const buffer = await file.arrayBuffer();
          
          // Extract text using OCR
          reportText = await extractTextFromImage(buffer);
          console.log('OCR completed, extracted text length:', reportText.length);
          
          if (!reportText.trim()) {
            return NextResponse.json(
              { error: 'No text could be extracted from the image. Please ensure the image contains clear, readable text.' },
              { status: 400 }
            );
          }
        } catch (ocrError) {
          console.error('OCR processing failed:', ocrError);
          return NextResponse.json(
            { error: ocrError instanceof Error ? ocrError.message : 'Failed to extract text from image. Please try again or copy the text manually.' },
            { status: 400 }
          );
        }
      } else if (file.type.startsWith('text/') || 
                 file.type === 'application/msword' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          reportText = await file.text();
        } catch (textError) {
          console.error('Text file processing failed:', textError);
          return NextResponse.json(
            { error: 'Failed to read text file. Please try again.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a PDF, image (JPG, PNG, GIF, WebP), or text file.' },
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

    // Check if we have the required API key for AI analysis
    const hasApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!hasApiKey) {
      console.log('No API key found, using mock analysis for demo purposes');
      // Use mock analysis when API key is not available
      const analysis = createMockAnalysis(reportText);
      return NextResponse.json(analysis);
    }

    // Try to use real AI analysis
    try {
      const { analyzeMedicalReport } = await import('@/ai/flows/medicalReportFlow');
      const analysis = await analyzeMedicalReport({ reportText });
      return NextResponse.json(analysis);
    } catch (error) {
      console.warn('AI analysis failed, falling back to mock analysis:', error);
      // Fall back to mock analysis if AI fails
      const analysis = createMockAnalysis(reportText);
      return NextResponse.json(analysis);
    }
  } catch (error) {
    console.error('Medical report analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze medical report. Please try again.' },
      { status: 500 }
    );
  }
}