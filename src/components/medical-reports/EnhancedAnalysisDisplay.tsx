import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Clock,
  TrendingUp,
  FileText,
  Stethoscope
} from 'lucide-react';

interface AnalysisSection {
  title: string;
  content: string;
  type: 'summary' | 'findings' | 'recommendations' | 'terminology' | 'metrics';
  priority: 'high' | 'medium' | 'low';
  icon?: string;
}

interface EnhancedAnalysisDisplayProps {
  sections: AnalysisSection[];
  confidence: number;
  processingTime: string;
  isLoading?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'summary':
      return <FileText className="h-5 w-5" />;
    case 'findings':
      return <Activity className="h-5 w-5" />;
    case 'recommendations':
      return <TrendingUp className="h-5 w-5" />;
    case 'terminology':
      return <Brain className="h-5 w-5" />;
    case 'metrics':
      return <Heart className="h-5 w-5" />;
    default:
      return <Stethoscope className="h-5 w-5" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'summary':
      return 'bg-blue-50 border-blue-200';
    case 'findings':
      return 'bg-purple-50 border-purple-200';
    case 'recommendations':
      return 'bg-green-50 border-green-200';
    case 'terminology':
      return 'bg-orange-50 border-orange-200';
    case 'metrics':
      return 'bg-pink-50 border-pink-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const formatContent = (content: string) => {
  // Split content into paragraphs and format
  const paragraphs = content.split('\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();
    
    // Handle bullet points
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      return (
        <li key={index} className="ml-4 mb-2">
          {trimmed.substring(1).trim()}
        </li>
      );
    }
    
    // Handle numbered lists
    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={index} className="mb-2 ml-4">
          <span className="font-medium text-primary">{trimmed.match(/^\d+\./)?.[0]}</span>
          <span className="ml-2">{trimmed.replace(/^\d+\.\s*/, '')}</span>
        </div>
      );
    }
    
    // Handle bold text (markdown-style)
    if (trimmed.includes('**')) {
      const parts = trimmed.split('**');
      return (
        <p key={index} className="mb-3 leading-relaxed">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="font-semibold text-gray-900">{part}</strong>
            ) : (
              <span key={partIndex}>{part}</span>
            )
          )}
        </p>
      );
    }
    
    // Regular paragraphs
    return (
      <p key={index} className="mb-3 leading-relaxed text-gray-700">
        {trimmed}
      </p>
    );
  });
};

export function EnhancedAnalysisDisplay({ 
  sections, 
  confidence, 
  processingTime, 
  isLoading = false 
}: EnhancedAnalysisDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Generating Enhanced Analysis...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort sections by priority
  const sortedSections = [...sections].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className="space-y-6">
      {/* Analysis Metrics Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-blue-600" />
              <span className="text-blue-900">Enhanced Medical Analysis</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {/* <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{processingTime}</span>
              </div> */}
              {/* <div className="flex items-center gap-2">
                <span className="text-gray-600">Confidence:</span>
                <Progress value={confidence * 100} className="w-20 h-2" />
                <span className="text-gray-800 font-medium">{Math.round(confidence * 100)}%</span>
              </div> */}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Analysis Sections */}
      <div className="grid gap-6">
        {sortedSections.map((section, index) => (
          <Card 
            key={index} 
            className={`transition-all duration-200 hover:shadow-md ${getTypeColor(section.type)}`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    {section.icon ? (
                      <span className="text-lg">{section.icon}</span>
                    ) : (
                      getTypeIcon(section.type)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(section.priority)}`}
                      >
                        {section.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {section.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {formatContent(section.content)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Medical Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important Medical Disclaimer:</strong> This analysis is generated by AI and is for informational purposes only. 
          Always consult with qualified healthcare professionals for medical advice, diagnosis, and treatment decisions. 
          Do not use this analysis as a substitute for professional medical consultation.
        </AlertDescription>
      </Alert>

      {/* Additional Information */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-700">How to use this analysis:</p>
              <ul className="space-y-1 list-disc list-inside ml-4">
                <li>Review each section based on priority level (High, Medium, Low)</li>
                <li>Pay special attention to findings and recommendations</li>
                <li>Refer to terminology explanations for medical terms you don't understand</li>
                <li>Discuss these findings with your healthcare provider</li>
                <li>Keep this analysis for your medical records</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
