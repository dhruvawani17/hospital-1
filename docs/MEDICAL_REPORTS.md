# Medical Report Q&A Feature

This document explains the AI-powered medical report analysis feature that allows users to upload medical reports and get AI-powered summaries and answers to their questions.

## Features

- **File Upload Support**: Accepts PDF, images (JPG, PNG, GIF, WebP), and text files up to 10MB
- **Text Input**: Alternative option to paste medical report text directly
- **AI-Powered Analysis**: Generates comprehensive summaries and key findings
- **Interactive Q&A**: Chat interface to ask questions about the uploaded report
- **Medical Disclaimers**: Proper disclaimers emphasizing the need for professional medical consultation
- **Responsive Design**: Works across desktop and mobile devices

## Architecture

### Components

- `MedicalReportsClient.tsx` - Main page component with step-by-step workflow
- `FileUpload.tsx` - File upload component with drag-and-drop support
- `ReportSummary.tsx` - Displays AI-generated report summary and key findings
- `QuestionAnswer.tsx` - Interactive chat interface for Q&A

### API Endpoints

- `/api/medical-reports/analyze` - Analyzes uploaded medical reports
- `/api/medical-reports/question` - Handles Q&A about medical reports

### AI Integration

- Uses Genkit with Google AI (Gemini 2.0 Flash) for medical analysis
- Falls back to pattern-matching mock responses when API key is not available
- Specialized medical prompting for accurate and safe responses

## Setup Instructions

### Prerequisites

1. Node.js (version 18 or higher)
2. Google AI API key (optional - demo mode works without it)

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Optional: For full AI functionality
GEMINI_API_KEY=your_google_ai_api_key_here
# OR
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### Getting a Google AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your environment variables

### Demo Mode

The feature works in demo mode even without an API key by providing intelligent pattern-matching responses based on common medical terms and scenarios.

## Usage

1. **Navigate to Medical Reports**: Click "Analyze Medical Report" on the homepage
2. **Upload Report**: Either upload a file or paste text content
3. **Get Analysis**: Click "Analyze Report" to receive AI-powered summary
4. **Ask Questions**: Use the Q&A interface to ask specific questions about your report

## Security & Privacy

- Files are processed in memory and not stored permanently
- All medical disclaimers emphasize the need for professional consultation
- No specific medical advice or diagnoses are provided
- Focus on explanation and understanding rather than medical interpretation

## Medical Disclaimers

This feature is designed for educational and informational purposes only:

- AI-generated summaries should not replace professional medical advice
- Users are encouraged to consult healthcare professionals for medical decisions
- The system emphasizes its limitations and the importance of professional consultation
- All responses include appropriate medical disclaimers

## Technical Details

### File Processing

- **PDF**: Basic text extraction (production would use PDF parsing libraries)
- **Images**: OCR not implemented (users directed to copy text manually)
- **Text Files**: Direct text extraction
- **Word Documents**: Basic text extraction

### Error Handling

- Comprehensive error messages for unsupported file types
- Fallback responses when AI services are unavailable
- User-friendly error messages with clear next steps

### Performance

- Client-side validation for file size and type
- Efficient text processing for large documents
- Progressive loading with clear progress indicators

## Development

### Adding New File Types

1. Update `ACCEPTED_FILE_TYPES` in `FileUpload.tsx`
2. Add processing logic in `/api/medical-reports/analyze/route.ts`
3. Test with sample files

### Customizing AI Responses

1. Modify prompts in `src/ai/flows/medicalReportFlow.ts`
2. Update fallback responses in API routes
3. Adjust medical disclaimer text as needed

### Testing

The feature includes comprehensive testing scenarios:

- File upload validation
- Text input processing
- AI analysis workflow
- Q&A interactions
- Error handling

Run the development server:

```bash
npm run dev
```

Navigate to `http://localhost:9002/medical-reports` to test the feature.

## Future Enhancements

- **OCR Integration**: For processing medical report images
- **PDF Parsing**: Advanced PDF text extraction
- **Report Templates**: Pre-defined templates for common report types
- **Export Functionality**: Save summaries as PDF or text
- **Multi-language Support**: Support for reports in different languages
- **Integration with EHR**: Connect with electronic health record systems