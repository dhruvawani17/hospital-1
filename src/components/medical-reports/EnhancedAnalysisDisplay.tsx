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
        <li key={index} className="ml-3 md:ml-4 mb-2 text-sm md:text-base leading-relaxed">
          {trimmed.substring(1).trim()}
        </li>
      );
    }
    
    // Handle numbered lists
    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={index} className="mb-2 ml-3 md:ml-4 flex gap-2">
          <span className="font-medium text-primary text-sm md:text-base flex-shrink-0">
            {trimmed.match(/^\d+\./)?.[0]}
          </span>
          <span className="text-sm md:text-base leading-relaxed">
            {trimmed.replace(/^\d+\.\s*/, '')}
          </span>
        </div>
      );
    }
    
    // Handle bold text (markdown-style)
    if (trimmed.includes('**')) {
      const parts = trimmed.split('**');
      return (
        <p key={index} className="mb-3 leading-relaxed text-sm md:text-base">
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
      <p key={index} className="mb-3 leading-relaxed text-gray-700 text-sm md:text-base">
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
        <CardHeader className="px-3 md:px-6 py-4 md:py-6">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 md:h-5 md:w-5 animate-pulse flex-shrink-0" />
            <span className="text-sm md:text-base">Generating Enhanced Analysis...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
          <div className="space-y-3 md:space-y-4">
            <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="space-y-2 mt-4">
              <div className="h-2 md:h-3 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-2 md:h-3 bg-gray-100 rounded animate-pulse w-4/5"></div>
              <div className="h-2 md:h-3 bg-gray-100 rounded animate-pulse w-3/5"></div>
            </div>
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
    <div className="space-y-4 md:space-y-6">
      {/* Analysis Metrics Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3 px-3 md:px-6">
          <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
              <span className="text-blue-900 text-sm md:text-base font-semibold">Enhanced Medical Analysis</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                <span className="text-gray-600">{processingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 hidden md:inline">Confidence:</span>
                <span className="text-gray-600 md:hidden">Conf:</span>
                <Progress value={confidence * 100} className="w-12 md:w-20 h-1.5 md:h-2" />
                <span className="text-gray-800 font-medium text-xs md:text-sm">{Math.round(confidence * 100)}%</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Analysis Sections */}
      <div className="grid gap-4 md:gap-6">
        {sortedSections.map((section, index) => (
          <Card 
            key={index} 
            className={`transition-all duration-200 hover:shadow-md ${getTypeColor(section.type)} touch-manipulation`}
          >
            <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 py-3 md:py-6">
              <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                <div className="flex items-start md:items-center gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white shadow-sm flex-shrink-0">
                    {section.icon ? (
                      <span className="text-base md:text-lg">{section.icon}</span>
                    ) : (
                      <div className="scale-75 md:scale-100">
                        {getTypeIcon(section.type)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-tight">
                      {section.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1.5 md:mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(section.priority)} px-2 py-0.5`}
                      >
                        <span className="hidden md:inline">{section.priority.toUpperCase()} PRIORITY</span>
                        <span className="md:hidden">{section.priority.toUpperCase()}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {section.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
              <div className="prose prose-sm max-w-none">
                {formatContent(section.content)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Medical Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50 mx-1 md:mx-0">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <AlertDescription className="text-amber-800 text-sm leading-relaxed">
          <strong>Important Medical Disclaimer:</strong> This analysis is generated by AI and is for informational purposes only. 
          Always consult with qualified healthcare professionals for medical advice, diagnosis, and treatment decisions. 
          Do not use this analysis as a substitute for professional medical consultation.
        </AlertDescription>
      </Alert>

      {/* Additional Information */}
      <Card className="bg-gray-50 border-gray-200 mx-1 md:mx-0">
        <CardContent className="pt-4 md:pt-6 px-3 md:px-6 pb-4 md:pb-6">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-gray-600 min-w-0 flex-1">
              <p className="font-medium text-gray-700">How to use this analysis:</p>
              <ul className="space-y-1 list-disc list-inside ml-2 md:ml-4 text-xs md:text-sm leading-relaxed">
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
