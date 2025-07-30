import { NextRequest, NextResponse } from 'next/server';

// Extract text from PDF using pdf-parse with enhanced error handling
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  let mainError: Error | null = null;
  
  try {
    console.log('Starting PDF text extraction using pdf-parse');
    
    // Use the pdf-parse library for proper PDF text extraction
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(pdfBuffer);
    
    console.log('PDF buffer size:', buffer.length, 'bytes');
    
    // Parse the PDF and extract text with options for better compatibility
    const options = {
      // Normalize whitespace
      normalizeWhitespace: false,
      // Don't use external fonts
      useExternalCMaps: false,
      // Continue on errors to extract what we can
      stopAtErrors: false
    };
    
    const pdfData = await pdfParse(buffer, options);
    
    console.log('PDF metadata:', {
      numpages: pdfData.numpages,
      numrender: pdfData.numrender,
      info: pdfData.info,
      textLength: pdfData.text ? pdfData.text.length : 0
    });
    
    if (!pdfData.text) {
      throw new Error('No text content found in PDF. This might be a scanned document - try uploading it as an image for OCR processing.');
    }
    
    const extractedText = pdfData.text.trim();
    
    // Lower the threshold from 10 to 3 characters to be more permissive
    if (extractedText.length < 3) {
      throw new Error('Very little readable text found in PDF (less than 3 characters). This might be a scanned document - try uploading it as an image for OCR processing.');
    }
    
    // Basic text cleanup - remove excessive whitespace but preserve structure
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    console.log('PDF parsing completed successfully, extracted text length:', cleanedText.length);
    
    return cleanedText;
  } catch (error) {
    console.error('pdf-parse failed:', error);
    mainError = error instanceof Error ? error : new Error(String(error));
  }
  
  // Fallback: Try simple text extraction for text-based PDFs
  try {
    console.log('Attempting fallback text extraction method...');
    const buffer = Buffer.from(pdfBuffer);
    
    // Convert buffer to string and look for readable text patterns
    const textContent = buffer.toString('binary');
    
    // Extract text between PDF text operators
    const textMatches = textContent.match(/\(([^)]+)\)/g) || [];
    const extractedParts = textMatches
      .map(match => match.slice(1, -1)) // Remove parentheses
      .filter(text => text.length > 1 && /[a-zA-Z]/.test(text))
      .map(text => text.replace(/[^\x20-\x7E]/g, ' ').trim())
      .filter(text => text.length > 0);
    
    if (extractedParts.length === 0) {
      throw new Error('No readable text found with fallback method');
    }
    
    const fallbackText = extractedParts.join(' ').trim();
    
    if (fallbackText.length < 10) {
      throw new Error('Insufficient text extracted with fallback method');
    }
    
    console.log('Fallback extraction successful, text length:', fallbackText.length);
    return fallbackText;
    
  } catch (fallbackError) {
    console.error('Fallback extraction also failed:', fallbackError);
  }
  
  // If both methods fail, provide helpful error message based on the main error
  if (mainError) {
    if (mainError.message.includes('No text content found') || 
        mainError.message.includes('Very little readable text found') ||
        mainError.message.includes('scanned document')) {
      throw mainError;
    }
    
    // Handle common pdf-parse errors with specific guidance
    if (mainError.message.toLowerCase().includes('invalid pdf') || 
        mainError.message.toLowerCase().includes('bad xref') ||
        mainError.message.toLowerCase().includes('corrupted')) {
      throw new Error('PDF file appears to be corrupted or has an unsupported format. Please try: 1) Re-saving the PDF from the original source, 2) Converting it to a different PDF format, or 3) Uploading as an image for OCR processing.');
    }
    
    if (mainError.message.toLowerCase().includes('password') || 
        mainError.message.toLowerCase().includes('encrypted')) {
      throw new Error('PDF appears to be password-protected or encrypted. Please unlock the PDF first or try uploading as an image.');
    }
    
    if (mainError.message.toLowerCase().includes('not found') ||
        mainError.message.toLowerCase().includes('cannot read')) {
      throw new Error('Unable to read PDF file. Please ensure the file is not corrupted and try again.');
    }
    
    // For other pdf-parse specific errors, suggest alternatives
    throw new Error(`PDF processing failed: ${mainError.message}. Try: 1) Converting the PDF to text manually, 2) Uploading as an image for OCR processing, or 3) Using a different PDF file.`);
  }
  
  throw new Error('Failed to extract text from PDF. Please ensure the PDF is not corrupted or password-protected, or try uploading as an image.');
}

// Extract text from image using OCR
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting OCR processing with Tesseract.js');
    
    const { createWorker } = await import('tesseract.js');
    
    // Create worker with simplified configuration for better reliability
    const worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        // Only log progress for debugging if needed
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    try {
      // Convert ArrayBuffer to Buffer for Tesseract
      const buffer = Buffer.from(imageBuffer);
      
      // Perform OCR with optimized settings for medical documents
      const { data: { text } } = await worker.recognize(buffer, {
        rectangles: undefined, // Process entire image
      });
      
      await worker.terminate();
      
      // Validate extracted text
      if (!text || text.trim().length < 10) {
        throw new Error('Insufficient readable text found in image. Please ensure the image is clear and contains readable text.');
      }
      
      const cleanedText = text.trim();
      console.log('OCR completed successfully, extracted text length:', cleanedText.length);
      
      return cleanedText;
      
    } catch (processingError) {
      await worker.terminate();
      throw processingError;
    }
    
  } catch (error) {
    console.error('OCR processing failed:', error);
    
    // Provide specific error messages based on common issues
    if (error instanceof Error) {
      if (error.message.includes('Insufficient readable text')) {
        throw error; // Re-throw specific validation error
      }
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        throw new Error('OCR processing failed due to network issues. Please check your connection and try again.');
      }
      
      if (error.message.includes('Memory') || error.message.includes('allocation')) {
        throw new Error('Image is too large for processing. Please try with a smaller image (max 10MB) or convert to PDF.');
      }
    }
    
    throw new Error('Failed to extract text from image. Please ensure the image contains clear, readable text, or try uploading as PDF or text.');
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