'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportSummaryProps {
  summary: string;
  keyFindings: string[];
}

export function ReportSummary({ summary, keyFindings }: ReportSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI Report Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
              Key Findings
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