'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, FileText, MessageCircle, AlertCircle, CheckCircle2, Sparkles, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { EnhancedAnalysisDisplay } from './EnhancedAnalysisDisplay';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisSection {
  title: string;
  content: string;
  type: 'summary' | 'findings' | 'recommendations' | 'terminology' | 'metrics';
  priority: 'high' | 'medium' | 'low';
  icon?: string;
}

interface EnhancedAnalysis {
  sections: AnalysisSection[];
  rawResponse: string;
  confidence: number;
  processingTime: string;
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'error';
  services: {
    environment: boolean;
    gemini: boolean;
    qdrant: boolean;
  };
  version?: string;
  feature?: string;
  configuration?: {
    maxFileSize: string;
    maxChunksPerDocument: number;
    rateLimitPerMinute: number;
    embeddingModel: string;
    chatModel: string;
    vectorDimension: number;
  };
  timestamp: string;
}

export function MedicalReportsClient() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysis | null>(null);
  const [isGeneratingEnhanced, setIsGeneratingEnhanced] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'chat' | 'enhanced'>('chat');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check system health on component mount
  React.useEffect(() => {

    const checkHealth = async () => {
      try {
        const response = await fetch('/api/medical-reports/health');
        const health = await response.json();
        setHealthCheck(health);
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthCheck({
          status: 'error',
          services: { environment: false, gemini: false, qdrant: false },
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsCheckingHealth(false);
      }
    };

    checkHealth();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setIsProcessed(false);
      setChatHistory([]);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      console.log('Uploading PDF...');
      const response = await fetch('/api/medical-reports/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to upload and process PDF');
      }

      setUploadStatus('success');
      setIsProcessed(true);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `PDF has been successfully processed! I found ${result.documentsProcessed || 'several'} sections in your medical report. You can now ask questions about your medical report.`,
        timestamp: new Date(),
      };
      setChatHistory([welcomeMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload and process the PDF. Please try again.';
      setError(errorMessage);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !isProcessed) return;

    setIsAsking(true);
    setError(null);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    setChatHistory((prev: ChatMessage[]) => [...prev, userMessage]);

    try {
      console.log('Asking question:', question);
      const response = await fetch('/api/medical-reports/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      console.log('Chat response status:', response.status);
      const result = await response.json();
      console.log('Chat response data:', result);

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to get answer');
      }
      
      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.answer,
        timestamp: new Date(),
      };
      setChatHistory((prev: ChatMessage[]) => [...prev, assistantMessage]);
      setQuestion('');
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get answer. Please try again.';
      setError(errorMessage);
    } finally {
      setIsAsking(false);
    }
  };

  const handleEnhancedAnalysis = async () => {
    if (!isProcessed) return;

    setIsGeneratingEnhanced(true);
    setError(null);

    try {
      console.log('Generating enhanced analysis...');
      const response = await fetch('/api/medical-reports/enhanced-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: 'Please provide a comprehensive analysis of this medical report including key findings, terminology explanations, and recommendations.' 
        }),
      });

      console.log('Enhanced analysis response status:', response.status);
      const result = await response.json();
      console.log('Enhanced analysis response data:', result);

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to generate enhanced analysis');
      }
      
      setEnhancedAnalysis(result);
      setAnalysisMode('enhanced');
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate enhanced analysis. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGeneratingEnhanced(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setIsProcessed(false);
    setUploadStatus('idle');
    setChatHistory([]);
    setQuestion('');
    setError(null);
    setEnhancedAnalysis(null);
    setAnalysisMode('chat');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4">
          Medical Report Analysis
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed px-2 md:px-0">
          Upload your medical reports and ask questions to get detailed insights and explanations
        </p>
      </div>

      {isCheckingHealth && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-2 p-4">
            <LoadingSpinner className="h-4 w-4" />
            <span>Checking system status...</span>
          </CardContent>
        </Card>
      )}

      {healthCheck && healthCheck.status !== 'healthy' && !isCheckingHealth && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">System Setup Required</p>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  {healthCheck.services.environment ? '✅' : '❌'} Environment Configuration
                </div>
                <div className="flex items-center gap-2">
                  {healthCheck.services.gemini ? '✅' : '❌'} Gemini AI Connection
                </div>
                <div className="flex items-center gap-2">
                  {healthCheck.services.qdrant ? '✅' : '❌'} Qdrant Database Connection
                </div>
              </div>
              {!healthCheck.services.qdrant && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Database Connection Issue:</p>
                  <p className="text-sm">Please check your Qdrant database configuration and ensure it's accessible.</p>
                </div>
              )}
              {!healthCheck.services.gemini && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">AI Service Issue:</p>
                  <p className="text-sm">Please check your Google Gemini API key configuration.</p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('Qdrant') && (
              <div className="mt-2">
                <p className="text-sm">To fix this:</p>
                <ol className="list-decimal list-inside text-sm mt-1">
                  <li>Start Docker Desktop</li>
                  <li>Run: <code className="bg-muted px-1 rounded">docker-compose -f docker-compose.qdrant.yml up -d</code></li>
                  <li>Wait for Qdrant to start and try again</li>
                </ol>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="px-3 md:px-6 py-4 md:py-6">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-base md:text-lg">Upload Medical Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 md:px-6 pb-4 md:pb-6">
          <div>
            <Label htmlFor="pdf-upload" className="text-sm md:text-base">Select PDF File</Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={isUploading}
              className="mt-1 text-sm md:text-base"
            />
          </div>
          
          {file && (
            <div className="flex items-center gap-2 p-2.5 md:p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs md:text-sm font-medium truncate block">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              onClick={handleUpload}
              disabled={!file || isUploading || (healthCheck ? healthCheck.status !== 'healthy' : true)}
              className="flex-1 w-full md:w-auto"
              size="sm"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-sm md:text-base">Processing...</span>
                </>
              ) : (
                <span className="text-sm md:text-base">Upload & Process PDF</span>
              )}
            </Button>
            
            {(file || isProcessed) && (
              <Button variant="outline" onClick={resetAll} size="sm" className="w-full md:w-auto">
                <span className="text-sm md:text-base">Reset</span>
              </Button>
            )}
          </div>

          {uploadStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
              <AlertDescription className="text-sm md:text-base">
                PDF successfully uploaded and processed! You can now ask questions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Section */}
      {isProcessed && (
        <div className="space-y-4 md:space-y-6">
          {/* Analysis Mode Selector */}
          <Card>
            <CardHeader className="px-3 md:px-6 py-4 md:py-6">
              <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="text-base md:text-lg">Medical Report Analysis</span>
                </span>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant={analysisMode === 'chat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAnalysisMode('chat')}
                    className="flex-1 md:flex-none"
                  >
                    <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Chat</span>
                    <span className="hidden sm:inline ml-1">Mode</span>
                  </Button>
                  <Button
                    variant={analysisMode === 'enhanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAnalysisMode('enhanced')}
                    className="flex-1 md:flex-none"
                  >
                    <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Enhanced</span>
                    <span className="hidden sm:inline ml-1">Analysis</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
              {analysisMode === 'enhanced' && !enhancedAnalysis && (
                <div className="text-center py-6 md:py-8">
                  <Button
                    onClick={handleEnhancedAnalysis}
                    disabled={isGeneratingEnhanced}
                    size="lg"
                    className="mb-4 w-full md:w-auto"
                  >
                    {isGeneratingEnhanced ? (
                      <>
                        <LoadingSpinner className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        <span className="text-sm md:text-base">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        <span className="text-sm md:text-base">Generate Enhanced Analysis</span>
                      </>
                    )}
                  </Button>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed px-2 md:px-0">
                    Get a comprehensive, structured analysis of your medical report using advanced AI formatting.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Mode */}
          {analysisMode === 'chat' && (
            <Card>
              <CardHeader className="px-3 md:px-6 py-4 md:py-6">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-base md:text-lg">Chat with Your Medical Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-3 md:px-6 pb-4 md:pb-6">
                {/* Chat History */}
                <div className="space-y-3 md:space-y-4 max-h-80 md:max-h-96 overflow-y-auto">
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[80%] p-2.5 md:p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Question Input */}
                <div className="flex flex-col md:flex-row gap-2">
                  <Textarea
                    placeholder="Ask a question about your medical report..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isAsking}
                    className="flex-1 text-sm md:text-base"
                    rows={2}
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={!question.trim() || isAsking}
                    className="self-end md:self-end w-full md:w-auto"
                    size="sm"
                  >
                    {isAsking ? (
                      <LoadingSpinner className="h-3 w-3 md:h-4 md:w-4" />
                    ) : (
                      <span className="text-sm md:text-base">Ask</span>
                    )}
                  </Button>
                </div>

                <div className="text-xs md:text-sm text-muted-foreground">
                  <p className="mb-2">💡 Example questions:</p>
                  <ul className="list-disc list-inside ml-2 md:ml-4 space-y-1 leading-relaxed">
                    <li>What are the key findings in this report?</li>
                    <li>Are there any abnormal values?</li>
                    <li>What do these test results mean?</li>
                    <li>Should I be concerned about anything?</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Analysis Mode */}
          {analysisMode === 'enhanced' && enhancedAnalysis && (
            <EnhancedAnalysisDisplay
              sections={enhancedAnalysis.sections}
              confidence={enhancedAnalysis.confidence}
              processingTime={enhancedAnalysis.processingTime}
            />
          )}

          {/* Loading State for Enhanced Analysis */}
          {analysisMode === 'enhanced' && isGeneratingEnhanced && (
            <EnhancedAnalysisDisplay
              sections={[]}
              confidence={0}
              processingTime="0ms"
              isLoading={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
