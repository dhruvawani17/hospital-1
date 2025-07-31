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
    
  } catch (pdfParseError: any) {
    console.log('pdf-parse failed, trying basic text extraction...', pdfParseError?.message);
    
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

// Enhanced image processing with optimized OpenAI Vision
async function processImageWithAI(imageBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Attempting optimized OpenAI Vision analysis for medical report image');
    
    // Convert buffer to base64 for OpenAI Vision API
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Detect image type for better processing
    const firstBytes = new Uint8Array(imageBuffer.slice(0, 8));
    let mimeType = 'image/jpeg'; // Default
    
    if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) {
      mimeType = 'image/png';
    } else if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) {
      mimeType = 'image/jpeg';
    } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49) {
      mimeType = 'image/gif';
    }
    
    const { openai } = await import('@/ai/openai');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Supports vision
      messages: [
        {
          role: "system",
          content: `You are a specialized medical document OCR assistant. Extract ALL visible text from medical reports, lab results, or medical documents in the image with high accuracy and speed.

CRITICAL INSTRUCTIONS:
- Extract the complete text content, preserving structure and medical terminology exactly as written
- Include ALL patient information, test results, numerical values, dates, recommendations, and medical notes
- Maintain the original order and organization of information as it appears in the document
- Pay special attention to numbers, units (mg/dL, mmHg, etc.), and medical abbreviations
- If text is partially unclear, make best medical interpretation but note uncertainty with [unclear]
- Do not add analysis, interpretation, or medical advice - only extract visible text
- Format output as clean, readable text that preserves the document's structure
- Process quickly while maintaining accuracy for real-time analysis

Focus on extracting:
1. Patient demographics and identifiers
2. Test names and numerical results with units
3. Reference ranges and normal values
4. Dates and times
5. Provider names and recommendations
6. Any abnormal flags or critical values`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text content from this medical report image. Focus on accuracy and completeness:"
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
      max_tokens: 2500, // Increased for longer reports
      temperature: 0.1 // Very low for consistent extraction
    });

    const extractedText = response.choices[0]?.message?.content;
    
    if (extractedText && extractedText.trim().length > 15) {
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
// Extract text from image using OCR with optimized Tesseract.js configuration
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting optimized image text extraction');
  
  // First try Tesseract.js OCR with optimized settings
  try {
    console.log('Attempting Tesseract.js OCR with optimized configuration...');
    
    const { createWorker } = await import('tesseract.js');
    
    console.log('Creating optimized Tesseract worker...');
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
        }
      },
      cachePath: './.next/cache/tesseract',
      gzip: false
    });
    
    console.log('Worker created, starting optimized recognition...');
    
    // Enhanced OCR settings for medical documents
    await worker.setParameters({
      'tessedit_pageseg_mode': 1 as any, // Automatic page segmentation with OSD
      'tessedit_ocr_engine_mode': 1 as any, // LSTM neural net mode
      'preserve_interword_spaces': '1',
      'textord_really_old_xheight': '1',
      'textord_min_linesize': '1.25',
    });
    
    // Process the image buffer with optimized settings
    const { data: { text, confidence } } = await worker.recognize(Buffer.from(imageBuffer));
    
    await worker.terminate();
    
    console.log(`OCR completed. Confidence: ${confidence}%, Text length: ${text?.length || 0}`);
    
    // Accept results with lower confidence threshold for medical documents
    if (text && text.trim().length > 15 && confidence > 20) {
      console.log('Tesseract OCR successful with optimized settings');
      return text.trim();
    } else {
      console.log(`Tesseract OCR quality insufficient (confidence: ${confidence}%), trying OpenAI Vision...`);
      throw new Error('OCR confidence too low');
    }
    
  } catch (tesseractError: any) {
    console.log('Tesseract OCR failed, trying OpenAI Vision...', tesseractError?.message);
    
    // Fallback to OpenAI Vision with faster processing
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

// Enhanced analysis function that actually analyzes the extracted content
function createContentBasedAnalysis(reportText: string) {
  const reportLower = reportText.toLowerCase();
  const lines = reportText.split('\n').filter(line => line.trim().length > 3);
  const words = reportText.split(/\s+/).filter(word => word.length > 2);
  
  const findings: string[] = [];
  let summary = '';
  
  // Extract specific values and measurements
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
  
  const medicalValues = extractMedicalValues(reportText);
  
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
    if (pattern.test(reportText)) {
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
    const matches = reportText.match(pattern);
    if (matches && matches.length > 0) {
      matches.slice(0, 3).forEach(match => { // Limit to first 3 matches
        findings.push(`Provider recommendation: ${match.trim()}`);
      });
    }
  });
  
  // Generate contextual summary based on content
  const contentLength = reportText.length;
  const hasNumericValues = /\d+\.?\d*\s*(mg\/dl|mmhg|bpm|°f|°c|%)/gi.test(reportText);
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
  
  // Add extraction success indicator
  findings.push(`✓ Text extraction successful: ${contentLength} characters processed`);
  
  return {
    summary,
    keyFindings: findings,
    reportText: reportText,
    debugInfo: {
      extractedLength: contentLength,
      linesCount: lines.length,
      wordsCount: words.length,
      hasNumericValues,
      medicalValues: Object.keys(medicalValues),
      extractionSuccessful: true
    }
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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
    let extractionDetails = {
      method: '',
      fileSize: 0,
      processingTime: 0,
      extractedLength: 0
    };

    // Extract text from file if provided
    if (file) {
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      extractionDetails.fileSize = file.size;
      const extractionStart = Date.now();
      
      if (file.type === 'application/pdf') {
        try {
          console.log('Starting PDF text extraction');
          extractionDetails.method = 'PDF parsing';
          const buffer = await file.arrayBuffer();
          reportText = await extractTextFromPDF(buffer);
          extractionDetails.processingTime = Date.now() - extractionStart;
          extractionDetails.extractedLength = reportText.length;
          
          console.log('PDF processing completed:', {
            extractedLength: reportText.length,
            processingTime: extractionDetails.processingTime,
            preview: reportText.substring(0, 100) + '...'
          });
          
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
          extractionDetails.method = 'OCR + AI Vision';
          
          // Convert file to buffer for OCR processing
          const buffer = await file.arrayBuffer();
          
          // Extract text using OCR
          reportText = await extractTextFromImage(buffer);
          extractionDetails.processingTime = Date.now() - extractionStart;
          extractionDetails.extractedLength = reportText.length;
          
          console.log('OCR completed:', {
            extractedLength: reportText.length,
            processingTime: extractionDetails.processingTime,
            preview: reportText.substring(0, 100) + '...'
          });
          
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
          extractionDetails.method = 'Direct text reading';
          reportText = await file.text();
          extractionDetails.processingTime = Date.now() - extractionStart;
          extractionDetails.extractedLength = reportText.length;
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
      extractionDetails.method = 'Manual text input';
      extractionDetails.extractedLength = reportText.length;
    }

    if (!reportText.trim()) {
      return NextResponse.json(
        { error: 'No text content found in the provided input' },
        { status: 400 }
      );
    }

    console.log('Text extraction successful:', extractionDetails);

    // Check if we have the required API key for AI analysis
    const hasApiKey = process.env.OPENAI_API_KEY;
    const analysisStart = Date.now();
    
    if (!hasApiKey) {
      console.log('No OpenAI API key found, using enhanced content-based analysis');
      // Use enhanced content-based analysis instead of generic mock
      const analysis = createContentBasedAnalysis(reportText);
      analysis.debugInfo = {
        ...analysis.debugInfo,
        analysisMethod: 'Content-based analysis (no API key)',
        totalProcessingTime: Date.now() - startTime,
        extractionDetails
      } as any;
      return NextResponse.json(analysis);
    }

    // Try to use real AI analysis
    try {
      console.log('Attempting OpenAI analysis...');
      const { analyzeMedicalReport } = await import('@/ai/flows/medicalReportFlow');
      const analysis = await analyzeMedicalReport({ reportText });
      
      // Add debug information to successful AI analysis
      const enhancedAnalysis = {
        ...analysis,
        debugInfo: {
          analysisMethod: 'OpenAI GPT-4o-mini',
          totalProcessingTime: Date.now() - startTime,
          aiProcessingTime: Date.now() - analysisStart,
          extractionDetails,
          openaiSuccess: true
        }
      };
      
      console.log('OpenAI analysis completed successfully');
      return NextResponse.json(enhancedAnalysis);
    } catch (error) {
      console.warn('AI analysis failed, falling back to enhanced content-based analysis:', error);
      // Fall back to enhanced content-based analysis if AI fails
      const analysis = createContentBasedAnalysis(reportText);
      analysis.debugInfo = {
        ...analysis.debugInfo,
        analysisMethod: 'Content-based analysis (OpenAI fallback)',
        totalProcessingTime: Date.now() - startTime,
        extractionDetails,
        openaiError: error instanceof Error ? error.message : 'Unknown error'
      } as any;
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