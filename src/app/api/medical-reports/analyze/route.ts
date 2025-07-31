import { NextRequest, NextResponse } from 'next/server';

// Enhanced PDF processing with OpenAI Vision fallback for image-based PDFs
async function processPDFWithAI(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Attempting OpenAI Vision analysis for PDF document');
    
    // For PDF to image conversion, we'd need additional libraries
    // For now, we'll handle this as a limitation and provide clear guidance
    throw new Error('PDF Vision analysis requires additional setup. Please try extracting text manually or converting PDF pages to images first.');
    
  } catch (error) {
    console.error('PDF Vision processing failed:', error);
    throw error;
  }
}
// Extract text from PDF using pdf-parse
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting comprehensive PDF text extraction');
  
  // First try using pdf-parse library
  try {
    console.log('Attempting pdf-parse extraction...');
    
    const pdfParse = await import('pdf-parse');
    const buffer = Buffer.from(pdfBuffer);
    
    const pdfData = await pdfParse.default(buffer);
    const extractedText = pdfData.text?.trim();
    
    if (extractedText && extractedText.length > 20) {
      console.log('PDF parsing successful with pdf-parse, extracted text length:', extractedText.length);
      return extractedText;
    } else {
      console.log('pdf-parse returned insufficient text, trying fallback method');
      throw new Error('pdf-parse returned insufficient text');
    }
    
  } catch (pdfParseError) {
    console.log('pdf-parse failed, trying basic text extraction...', pdfParseError.message);
    
    // Fallback: Try basic text extraction for simple PDFs
    try {
      const buffer = Buffer.from(pdfBuffer);
      const textContent = buffer.toString('utf8');
      
      // Look for readable content patterns
      const lines = textContent.split('\n')
        .map(line => line.replace(/[^\x20-\x7E]/g, ' ').trim())
        .filter(line => line.length > 2 && /[a-zA-Z]/.test(line))
        .slice(0, 200); // Increased limit for better extraction
      
      const extractedText = lines.join('\n').trim();
      
      if (extractedText.length > 50) {
        console.log('Basic PDF extraction successful, text length:', extractedText.length);
        return extractedText;
      } else {
        throw new Error('Basic text extraction insufficient');
      }
      
    } catch (basicError) {
      console.log('Basic PDF extraction also failed, this may be an image-based PDF');
      
      // Provide clear guidance for image-based PDFs
      throw new Error(`Unable to extract text from this PDF. This appears to be an image-based or scanned PDF. Please try:

1. Converting the PDF pages to images (JPG/PNG) and uploading those instead
2. Using your PDF viewer's text selection tool to copy and paste the text manually
3. If possible, requesting a text-based version of the report from your healthcare provider

The system can analyze images of medical reports using advanced OCR and AI vision technology.`);
    }
  }
}

// Enhanced image processing with OpenAI Vision fallback
async function processImageWithAI(imageBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Attempting OpenAI Vision analysis for medical report image');
    
    // Convert buffer to base64 for OpenAI Vision API
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = 'image/jpeg'; // Assume JPEG, could be detected
    
    const { openai } = await import('@/ai/openai');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Supports vision
      messages: [
        {
          role: "system",
          content: `You are a medical document OCR assistant. Extract ALL visible text from medical reports, lab results, or medical documents in the image. 

IMPORTANT:
- Extract the complete text content, preserving structure and formatting as much as possible
- Include all patient information, test results, values, dates, recommendations, and medical notes
- Maintain the original order and organization of information
- If text is unclear, make reasonable medical interpretations but note uncertainty
- Do not add analysis or interpretation - only extract the visible text content
- Format the output as clean, readable text that preserves the document structure`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text content from this medical report image:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const extractedText = response.choices[0]?.message?.content;
    
    if (extractedText && extractedText.trim().length > 20) {
      console.log('OpenAI Vision extraction successful, text length:', extractedText.length);
      return extractedText.trim();
    } else {
      throw new Error('OpenAI Vision did not extract sufficient text');
    }
    
  } catch (error) {
    console.error('OpenAI Vision processing failed:', error);
    throw error;
  }
}
// Extract text from image using OCR with proper Tesseract.js configuration
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting comprehensive image text extraction');
  
  // First try Tesseract.js OCR
  try {
    console.log('Attempting Tesseract.js OCR...');
    
    const { createWorker } = await import('tesseract.js');
    
    console.log('Creating Tesseract worker...');
    const worker = await createWorker('eng', 1, {
      logger: (m) => console.log('Tesseract:', m.status, m.progress),
      cachePath: './.next/cache/tesseract',
      gzip: false,
      corePath: undefined // Let Tesseract use default
    });
    
    console.log('Worker created successfully, starting recognition...');
    
    // Process the image buffer
    const { data: { text, confidence } } = await worker.recognize(Buffer.from(imageBuffer), {
      rectangles: false,
      pdfTitle: 'Medical Report',
      preserveInterwordSpaces: true
    });
    
    await worker.terminate();
    
    console.log(`OCR completed. Confidence: ${confidence}%, Text length: ${text?.length || 0}`);
    
    // Accept results with reasonable confidence and length
    if (text && text.trim().length > 20 && confidence > 25) {
      console.log('Tesseract OCR successful');
      return text.trim();
    } else {
      console.log(`Tesseract OCR quality insufficient, trying OpenAI Vision...`);
      throw new Error('OCR confidence too low');
    }
    
  } catch (tesseractError) {
    console.log('Tesseract OCR failed, trying OpenAI Vision...', tesseractError.message);
    
    // Fallback to OpenAI Vision
    try {
      return await processImageWithAI(imageBuffer);
    } catch (visionError) {
      console.error('Both OCR and Vision failed:', { tesseractError, visionError });
      
      // Provide comprehensive error message
      throw new Error(`Unable to extract text from image using both OCR and AI vision analysis. This could be due to:
- Image quality issues (blurry, low resolution, poor lighting)
- Complex formatting or handwritten text
- API service limitations

Please try:
1. Uploading a clearer, higher resolution image
2. Converting the image to a PDF format
3. Manually typing the text from your medical report
4. Ensuring the image contains clearly readable printed text`);
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
    const hasApiKey = process.env.OPENAI_API_KEY;
    
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