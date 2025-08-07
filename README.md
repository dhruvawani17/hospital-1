# HealthFirst Connect 🏥

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, comprehensive hospital management system built with Next.js, TypeScript, and AI-powered features. HealthFirst Connect streamlines hospital operations with intelligent appointment scheduling and patient management capabilities.

## ✨ Features

### 🎯 Core Features
- **Service Catalog**: Comprehensive display of hospital services with detailed descriptions
- **Smart Appointment Scheduler**: Interactive calendar with AI-powered appointment suggestions
- **Patient Management**: Complete patient information and reservation system
- **Payment Processing**: Simulated payment system with receipt generation
- **Real-time Chat**: Interactive chatbot for patient assistance and inquiries

### 🤖 AI-Powered Features
- **Smart Appointment Suggestions**: AI recommends optimal appointment times based on availability
- **Intelligent Chatbot**: AI-powered patient assistance and inquiry handling
- **Medical Report Analysis**: AI-powered PDF analysis using LangChain and Qdrant for intelligent report interpretation
- **Automated Workflows**: Streamlined hospital operations with AI optimization

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Clean, minimalist design with Radix UI components
- **Accessibility**: WCAG compliant with proper semantic markup
- **Progressive Web App**: Fast loading with offline capabilities

## 🏗️ Architecture

This project consists of three main components:

### **Frontend** 
- **Framework**: Next.js 15 with TypeScript for type-safe development
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives for accessible components
- **State Management**: React Context API and hooks
- **Forms**: React Hook Form with Zod validation

### **Backend Utilities**
- **Java Utilities**: Patient ID validation and data processing
- **API Routes**: Next.js API routes for server-side functionality

### **AI Integration**
- **Google AI (Gemini 2.0)**: Intelligent appointment scheduling and chatbot functionality
- **Genkit Framework**: AI workflow management and prompt engineering
- **Smart Recommendations**: AI-powered appointment time suggestions

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Java** (for backend utilities)
- **Google AI API Key** (optional - demo mode available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhruvawani17/hospital-1.git
   cd hospital-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Add your Google AI API key for full AI functionality
   GEMINI_API_KEY=your_google_ai_api_key_here
   # OR
   GOOGLE_API_KEY=your_google_ai_api_key_here
   
   # For Medical Report Analysis feature
   OPENAI_API_KEY=your_openai_api_key_here
   QDRANT_URL=http://localhost:6333
   ```

4. **Set up Qdrant Vector Database** (for Medical Report Analysis)
   ```bash
   # Using Docker Compose
   docker-compose -f docker-compose.qdrant.yml up -d
   
   # Or using Docker directly
   docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:9002](http://localhost:9002)

### Getting Google AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your environment variables

**Note**: The application works in demo mode even without an API key!

## 📖 Usage Examples

### Booking an Appointment
1. Navigate to the **Services** page to browse available hospital services
2. Select a service and click **Book Appointment**
3. Choose your preferred date and time from the interactive calendar
4. Fill in patient information in the reservation form
5. Complete the simulated payment process
6. Receive a digital receipt via email

### Using the Chatbot
1. Click the **Chat** button in the navigation
2. Ask questions about hospital services, appointments, or general inquiries
3. Receive intelligent responses powered by AI
4. Get directed to appropriate hospital resources

### Using Medical Report Analysis
1. Navigate to **Medical Reports** in the navigation
2. Upload a PDF medical report using the file upload interface
3. Wait for the AI to process and analyze the document
4. Ask questions about your medical report in natural language
5. Receive detailed explanations of medical terms, test results, and findings
6. Get insights presented in easy-to-understand language

**Example Questions:**
- "What are the key findings in this report?"
- "Are there any abnormal values I should be concerned about?"
- "Can you explain what these test results mean?"
- "Should I follow up with any specific specialist?"

## 🛠️ Technologies Used

### Frontend Stack
- **Next.js 15** - React framework with App Router
- **React 18.3.1** - UI library with hooks and context
- **TypeScript 5** - Type-safe JavaScript development
- **Tailwind CSS 3.4.1** - Utility-first CSS framework

### UI Components & Design
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Performant form library
- **Zod** - TypeScript-first schema validation

### AI & Data Processing
- **Google AI (Gemini 2.0)** - Advanced language model for intelligent features
- **OpenAI GPT** - Medical report analysis and interpretation
- **LangChain** - AI application development framework
- **Qdrant** - Vector database for semantic search and retrieval
- **Genkit** - AI workflow framework

### Backend & Utilities
- **Firebase** - Authentication and real-time database
- **SendGrid** - Email service for notifications
- **Java Utilities** - Backend data validation and processing

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing and optimization
- **Tailwind Animate** - Animation utilities

## 🔌 API Endpoints

### Email Services
- **POST** `/api/send-confirmation-email`
  - Send appointment confirmation emails
  - Integrates with SendGrid for email delivery

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
4. **Make your changes** with proper commit messages
5. **Run tests** and ensure code quality (`npm run lint`, `npm run typecheck`)
6. **Push to your branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request** with a clear description

### Development Guidelines
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features when applicable
- Update documentation for new features
- Ensure all existing tests pass

### Areas for Contribution
- 🐛 **Bug fixes** - Help us identify and fix issues
- ✨ **New features** - Enhance the hospital management system
- 📚 **Documentation** - Improve guides and API documentation
- 🎨 **UI/UX improvements** - Make the interface more intuitive
- 🔧 **Performance optimization** - Help make the app faster
- 🌍 **Internationalization** - Add support for multiple languages

## Java Backend Utilities

The project includes Java utilities for backend operations:

- **PatientIdValidator**: Validates and formats hospital patient IDs
- Located in `java/` directory  
- See [`java/README.md`](java/README.md) for detailed documentation

### Building Java Components
```bash
javac java/src/main/java/com/hospital/utils/*.java
java com.hospital.utils.PatientIdValidatorTest
```

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server on port 9002
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint code linting
npm run typecheck    # Run TypeScript type checking

# AI Development
npm run genkit:dev   # Start Genkit AI development server
npm run genkit:watch # Start Genkit with file watching
```

## 🔐 Security & Privacy

- **Data Protection**: Files are processed in memory and not stored permanently
- **Medical Disclaimers**: All AI responses include appropriate medical disclaimers
- **No Medical Advice**: System provides information only, not medical diagnoses
- **Professional Consultation**: Users are encouraged to consult healthcare professionals
- **Secure Processing**: All patient data is handled with healthcare privacy standards



## 📞 Support & Contact

### Getting Help
- 📖 **Documentation**: Check our comprehensive docs in the `/docs` folder
- 🐛 **Bug Reports**: [Open an issue](https://github.com/dhruvawani17/hospital-1/issues) on GitHub
- 💡 **Feature Requests**: [Submit a feature request](https://github.com/dhruvawani17/hospital-1/issues/new)
- 📧 **Email Support**: Contact the development team for urgent issues

### Community
- ⭐ **Star the project** if you find it useful
- 🍴 **Fork and contribute** to help improve HealthFirst Connect
- 📢 **Share feedback** to help us make it better

### Maintainers
- **Lead Developer**: [@dhruvawani17](https://github.com/dhruvawani17)

---

<div align="center">

**Made with ❤️ for better healthcare management**

[⬆ Back to Top](#healthfirst-connect-)

</div>

