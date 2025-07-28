'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from './FileUpload';
import { ReportSummary } from './ReportSummary';
import { QuestionAnswer } from './QuestionAnswer';
import { 
  FileText, 
  Brain, 
  MessageSquare, 
  Upload, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  reportText: string;
}

export default function MedicalReportsClient() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportText, setReportText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'qa'>('upload');

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    setError(null);
    setCurrentStep('analyze');
  }, []);

  const handleTextInput = useCallback((text: string) => {
    setReportText(text);
    setError(null);
    // Removed auto-progression to analyze step
    // User must click submit button instead
  }, []);

  const handleAnalyze = async () => {
    if (!uploadedFile && !reportText.trim()) {
      setError('Please upload a file or enter report text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }
      
      if (reportText.trim()) {
        formData.append('text', reportText);
      }

      const response = await fetch('/api/medical-reports/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
      setCurrentStep('qa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze report');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setReportText('');
    setAnalysisResult(null);
    setError(null);
    setCurrentStep('upload');
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'upload': return 0;
      case 'analyze': return 50;
      case 'qa': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold mb-2">Medical Report Analysis</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Upload your medical reports and get AI-powered insights and answers to your questions.
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Upload className={`h-4 w-4 sm:h-5 sm:w-5 ${currentStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs sm:text-sm ${currentStep === 'upload' ? 'font-medium' : 'text-muted-foreground'}`}>Upload</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Brain className={`h-4 w-4 sm:h-5 sm:w-5 ${currentStep === 'analyze' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs sm:text-sm ${currentStep === 'analyze' ? 'font-medium' : 'text-muted-foreground'}`}>Analyze</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <MessageSquare className={`h-4 w-4 sm:h-5 sm:w-5 ${currentStep === 'qa' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs sm:text-sm ${currentStep === 'qa' ? 'font-medium' : 'text-muted-foreground'}`}>Q&A</span>
              </div>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="grid gap-6">
            <FileUpload onFileUpload={handleFileUpload} />
            
            <div className="text-center">
              <span className="text-muted-foreground">OR</span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Enter Report Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste your medical report text here..."
                    value={reportText}
                    onChange={(e) => handleTextInput(e.target.value)}
                    className="min-h-[200px]"
                  />
                  {reportText.trim() && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Text entered ({reportText.length} characters)
                    </div>
                  )}
                  {reportText.trim() && (
                    <Button 
                      onClick={() => setCurrentStep('analyze')} 
                      className="w-full h-12 sm:h-10"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Submit Text for Analysis
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Analyze */}
        {currentStep === 'analyze' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Ready to Analyze
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {uploadedFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>File: {uploadedFile.name}</span>
                  </div>
                )}
                {reportText && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>Text: {reportText.length} characters</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 h-12 sm:h-10">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyze Report
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetAnalysis} className="h-12 sm:h-10">
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results and Q&A */}
        {currentStep === 'qa' && analysisResult && (
          <div className="space-y-6">
            <ReportSummary
              summary={analysisResult.summary}
              keyFindings={analysisResult.keyFindings}
            />
            <QuestionAnswer reportText={analysisResult.reportText} />
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetAnalysis}>
                Analyze Another Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}