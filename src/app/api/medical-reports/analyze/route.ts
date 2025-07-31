import { NextRequest, NextResponse } from 'next/server';

// Alternative PDF processing using OpenAI Vision for image-based PDFs
async function convertPDFToImageAnalysis(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Processing PDF with AI Vision (attempting direct PDF analysis)...');
    
    // Convert PDF buffer to base64 for OpenAI analysis
    const base64PDF = Buffer.from(pdfBuffer).toString('base64');
    
    const { openai } = await import('@/ai/openai');
    
    // Try to process PDF directly with OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a specialized medical document text extractor. Extract ALL visible text from medical documents, reports, or lab results.

CRITICAL INSTRUCTIONS:
- Extract complete text content exactly as it appears in the document
- Include ALL patient information, test results, numerical values, dates, and medical notes
- Preserve the original structure and order of information
- Pay special attention to medical terminology, units (mg/dL, mmHg, etc.), and numerical values
- If text is unclear, indicate with [unclear] but extract what you can
- Do not add interpretation or analysis - only extract visible text
- Format as clean, readable text preserving document structure
- Focus on accuracy and completeness for medical report analysis

Extract all text content from this medical document:`
        },
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: "Extract all readable text from this PDF medical document. Focus on accuracy and completeness:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64PDF}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 3000,
      temperature: 0.1
    });

    const extractedText = response.choices[0]?.message?.content;
    
    if (extractedText && extractedText.trim().length > 15) {
      console.log('OpenAI PDF Vision analysis successful, text length:', extractedText.length);
      return extractedText.trim();
    } else {
      throw new Error('OpenAI Vision did not extract sufficient text from PDF');
    }
    
  } catch (error) {
    console.error('PDF Vision analysis failed:', error);
    throw error;
  }
}
// Enhanced PDF text extraction with improved filtering and image conversion
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting enhanced PDF text extraction');
  
  // First try using pdf-parse library
  try {
    console.log('Attempting pdf-parse extraction...');
    
    const pdfParse = await import('pdf-parse');
    const buffer = Buffer.from(pdfBuffer);
    
    const pdfData = await pdfParse.default(buffer);
    const extractedText = pdfData.text?.trim();
    
    if (extractedText && extractedText.length > 20) {
      // Validate that we have actual readable text, not binary data
      const readableRatio = (extractedText.match(/[a-zA-Z0-9\s]/g) || []).length / extractedText.length;
      
      if (readableRatio > 0.7) { // At least 70% readable characters
        console.log('PDF parsing successful with pdf-parse, extracted text length:', extractedText.length);
        return extractedText;
      } else {
        console.log('pdf-parse returned mostly binary data, trying image conversion...');
        throw new Error('pdf-parse returned mostly binary/encoded data');
      }
    } else {
      console.log('pdf-parse returned insufficient text, trying image conversion...');
      throw new Error('pdf-parse returned insufficient text');
    }
    
  } catch (pdfParseError: any) {
    console.log('pdf-parse failed, trying PDF-to-image conversion...', pdfParseError?.message);
    
    // Try PDF-to-image analysis for image-based PDFs
    try {
      return await convertPDFToImageAnalysis(pdfBuffer);
    } catch (imageAnalysisError) {
      console.log('PDF Vision analysis failed, trying improved text extraction...', imageAnalysisError);
      
      // Enhanced fallback: Try improved text extraction that filters binary data
      try {
        const buffer = Buffer.from(pdfBuffer);
        const textContent = buffer.toString('utf8');
        
        // Enhanced filtering to avoid binary data and PDF metadata
        const lines = textContent.split(/[\r\n]+/)
          .map(line => {
            // Remove common PDF metadata and binary indicators
            if (line.includes('/Type') || 
                line.includes('/Subtype') || 
                line.includes('/Filter') ||
                line.includes('stream') ||
                line.includes('endstream') ||
                line.includes('obj') ||
                line.includes('endobj') ||
                line.includes('PDF-') ||
                line.includes('JFIF') ||
                line.includes('DCTDecode') ||
                line.includes('/Length') ||
                line.includes('/Width') ||
                line.includes('/Height') ||
                line.includes('/ColorSpace') ||
                line.includes('/BitsPerComponent') ||
                line.includes('/Interpolate') ||
                line.includes('endstream') ||
                line.startsWith('/') ||
                line.match(/^[0-9\s]+$/) ||  // Pure number lines
                line.match(/^[^a-zA-Z]*$/) || // Lines with no letters
                line.length > 100) {  // Very long lines likely to be binary
              return '';
            }
            
            // Clean up the line and check if it's readable
            const cleaned = line.replace(/[^\x20-\x7E]/g, ' ').trim();
            
            // Filter out lines that are mostly non-alphabetic or very short
            const alphaRatio = (cleaned.match(/[a-zA-Z]/g) || []).length / Math.max(cleaned.length, 1);
            const hasColon = cleaned.includes(':');
            const hasNumbers = /\d/.test(cleaned);
            
            // Keep lines that look like medical data (have letters, numbers, colons)
            return (alphaRatio > 0.3 || (hasColon && hasNumbers)) && cleaned.length > 3 ? cleaned : '';
          })
          .filter(line => line.length > 0)
          .slice(0, 50); // Prevent too much data
        
        const extractedText = lines.join('\n').trim();
        
        if (extractedText.length > 50) {
          console.log('Enhanced PDF text extraction successful, text length:', extractedText.length);
          return extractedText;
        } else {
          throw new Error('Enhanced text extraction insufficient');
        }
        
      } catch (enhancedError) {
        console.log('All PDF extraction methods failed, this is likely an image-only PDF');
        
        // Provide comprehensive guidance for image-based PDFs
        throw new Error(`Unable to extract readable text from this PDF. This appears to be an image-based, scanned, or protected PDF.

**Recommended Solutions:**
1. **Convert to Image**: Save PDF pages as JPG/PNG images and upload those instead
2. **Copy Text Manually**: Use your PDF viewer's text selection tool to copy text
3. **Alternative Format**: Request a text-searchable version from your healthcare provider
4. **OCR Tools**: Use dedicated PDF OCR software to convert to searchable text

**Why this happens:**
- PDF contains embedded images instead of selectable text
- PDF has security restrictions preventing text extraction  
- PDF uses complex formatting that interferes with text parsing

The system can successfully analyze clear medical report images using advanced OCR and AI technology.`);
      }
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
// Extract text from image using optimized OCR and AI Vision
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting optimized image text extraction');
  
  // Try OpenAI Vision first for faster processing
  try {
    console.log('Attempting OpenAI Vision for faster medical image analysis...');
    return await processImageWithAI(imageBuffer);
  } catch (visionError: any) {
    console.log('OpenAI Vision failed, falling back to Tesseract OCR...', visionError?.message);
    
    // Fallback to Tesseract.js OCR with optimized settings
    try {
      console.log('Starting optimized Tesseract.js OCR...');
      
      const { createWorker } = await import('tesseract.js');
      
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
        cachePath: './.next/cache/tesseract',
        gzip: false
      });
      
      // Optimized OCR settings for medical documents - faster processing
      await worker.setParameters({
        'tessedit_pageseg_mode': 6 as any, // Uniform block of text (faster than mode 1)
        'tessedit_ocr_engine_mode': 1 as any, // LSTM neural net mode
        'preserve_interword_spaces': '1',
        'textord_really_old_xheight': '0', // Faster processing
        'tessedit_char_whitelist': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-/()[]{}% ', // Medical document characters
      });
      
      // Process the image buffer with faster settings
      const { data: { text, confidence } } = await worker.recognize(Buffer.from(imageBuffer));
      
      await worker.terminate();
      
      console.log(`OCR completed in optimized mode. Confidence: ${confidence}%, Text length: ${text?.length || 0}`);
      
      // Accept results with reasonable confidence for faster processing
      if (text && text.trim().length > 15 && confidence > 25) {
        console.log('Optimized Tesseract OCR successful');
        return text.trim();
      } else {
        console.log(`OCR quality insufficient (confidence: ${confidence}%), processing failed`);
        throw new Error('OCR confidence too low for reliable text extraction');
      }
      
    } catch (tesseractError: any) {
      console.error('Both Vision and OCR failed:', { visionError, tesseractError });
      
      // Provide comprehensive error message
      throw new Error(`Unable to extract text from image using both AI Vision and OCR analysis. 

**Possible causes:**
- Image quality issues (blurry, low resolution, poor lighting)
- Complex formatting, handwritten text, or unusual fonts
- API service limitations or connectivity issues

**Recommended solutions:**
1. **Improve Image Quality**: Upload a clearer, higher resolution image with good lighting
2. **Alternative Format**: Convert to PDF or try a different image format (PNG, JPG)
3. **Manual Entry**: Type the text from your medical report manually
4. **Document Scanning**: Use a dedicated document scanner app for better image quality

The system works best with clear, high-contrast medical reports with printed text.`);
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