'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Eye, EyeOff, Code, Clock, FileCheck } from 'lucide-react';

interface DebugInfo {
  analysisMethod?: string;
  totalProcessingTime?: number;
  aiProcessingTime?: number;
  extractionDetails?: {
    method: string;
    fileSize: number;
    processingTime: number;
    extractedLength: number;
  };
  extractedLength?: number;
  linesCount?: number;
  wordsCount?: number;
  hasNumericValues?: boolean;
  medicalValues?: string[];
  extractionSuccessful?: boolean;
  openaiSuccess?: boolean;
  openaiError?: string;
}

interface ReportSummaryProps {
  summary: string;
  keyFindings: string[];
  reportText?: string;
  debugInfo?: DebugInfo;
}

export function ReportSummary({ summary, keyFindings, reportText, debugInfo }: ReportSummaryProps) {
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const getAnalysisMethodBadge = () => {
    if (!debugInfo?.analysisMethod) return null;
    
    if (debugInfo.analysisMethod.includes('OpenAI')) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">AI Powered</Badge>;
    } else if (debugInfo.analysisMethod.includes('Content-based')) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Enhanced Analysis</Badge>;
    }
    return <Badge variant="outline">Standard</Badge>;
  };

  const getExtractionMethodBadge = () => {
    if (!debugInfo?.extractionDetails?.method) return null;
    
    const method = debugInfo.extractionDetails.method;
    if (method.includes('OCR')) {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">OCR + AI Vision</Badge>;
    } else if (method.includes('PDF')) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">PDF Parsing</Badge>;
    } else if (method.includes('Manual')) {
      return <Badge variant="outline">Manual Input</Badge>;
    }
    return <Badge variant="outline">{method}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Report Summary
          </div>
          <div className="flex items-center gap-2">
            {getAnalysisMethodBadge()}
            {getExtractionMethodBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Processing Info */}
        {debugInfo && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {debugInfo.extractionDetails && (
                  <div className="flex items-center gap-1">
                    <FileCheck className="h-4 w-4" />
                    <span>{debugInfo.extractionDetails.extractedLength} chars extracted</span>
                  </div>
                )}
                {debugInfo.totalProcessingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{(debugInfo.totalProcessingTime / 1000).toFixed(1)}s total</span>
                  </div>
                )}
                {debugInfo.extractionDetails?.processingTime && (
                  <div className="flex items-center gap-1">
                    <span>{(debugInfo.extractionDetails.processingTime / 1000).toFixed(1)}s extraction</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-xs"
              >
                <Code className="h-3 w-3 mr-1" />
                Debug Info
              </Button>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {showDebugInfo && debugInfo && (
          <Collapsible open={showDebugInfo}>
            <CollapsibleContent>
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Processing Details</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Analysis Method:</strong> {debugInfo.analysisMethod || 'Unknown'}</div>
                    <div><strong>Processing Time:</strong> {debugInfo.totalProcessingTime ? `${(debugInfo.totalProcessingTime / 1000).toFixed(2)}s` : 'N/A'}</div>
                    {debugInfo.extractionDetails && (
                      <>
                        <div><strong>Extraction Method:</strong> {debugInfo.extractionDetails.method}</div>
                        <div><strong>File Size:</strong> {debugInfo.extractionDetails.fileSize ? `${(debugInfo.extractionDetails.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</div>
                        <div><strong>Extracted Length:</strong> {debugInfo.extractionDetails.extractedLength} characters</div>
                        <div><strong>Extraction Time:</strong> {(debugInfo.extractionDetails.processingTime / 1000).toFixed(2)}s</div>
                      </>
                    )}
                    {debugInfo.openaiSuccess !== undefined && (
                      <div><strong>OpenAI Status:</strong> {debugInfo.openaiSuccess ? '✅ Success' : '❌ Failed'}</div>
                    )}
                    {debugInfo.openaiError && (
                      <div className="col-span-2"><strong>OpenAI Error:</strong> {debugInfo.openaiError}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Extracted Text Preview */}
        {reportText && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Extracted Text Preview
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExtractedText(!showExtractedText)}
              >
                {showExtractedText ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>
            
            {showExtractedText && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="text-sm font-mono bg-background/50 p-3 rounded border max-h-60 overflow-y-auto">
                    {reportText.length > 1000 ? (
                      <div>
                        <p className="mb-2 text-muted-foreground">Showing first 1000 characters of {reportText.length} total:</p>
                        <p className="whitespace-pre-wrap">{reportText.substring(0, 1000)}...</p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{reportText}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Text extraction successful • {reportText.length} characters • Ready for analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Summary */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
        </div>

        {/* Key Findings */}
        {keyFindings && keyFindings.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Key Findings ({keyFindings.length})
            </h3>
            <div className="space-y-2">
              {keyFindings.map((finding, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-1 bg-primary/10 rounded-full">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  </div>
                  <p className="text-sm flex-1">{finding}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Medical Disclaimer</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This AI-generated summary is for informational purposes only and should not replace professional medical advice. 
                Always consult with qualified healthcare professionals for medical decisions and treatment plans.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}