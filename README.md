hospital website 

## Architecture

This project consists of:
- **Frontend**: Next.js/TypeScript web application for hospital management
- **Backend Utilities**: Java utilities for data validation and processing
- **AI Features**: Medical report analysis powered by Google AI (Gemini)

## Java Backend Utilities

The project includes Java utilities for backend operations:

- **PatientIdValidator**: Validates and formats hospital patient IDs
- Located in `java/` directory
- See `java/README.md` for detailed documentation

### Quick Start (Java)

```bash
# Build and test Java utilities
./java/build.sh
```

## Environment Setup

### Google AI API Key (Required for Medical Report Analysis)

To enable the AI-powered medical report analysis feature:

1. Create a `.env.local` file in the root directory
2. Add your Google AI API key:

```bash
# Google AI API Key for medical report analysis
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### Getting a Google AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env.local` file

**Note**: The medical report feature works in demo mode without an API key, but requires the key for full AI functionality.