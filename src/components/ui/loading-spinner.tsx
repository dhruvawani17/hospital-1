'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        {/* Outer ring */}
        <div 
          className={cn(
            'rounded-full border-4 border-muted animate-spin',
            sizeClasses[size]
          )}
          style={{
            borderTopColor: 'hsl(var(--primary))',
            animationDuration: '1s'
          }}
        />
        {/* Inner pulse */}
        <div 
          className={cn(
            'absolute inset-1 rounded-full bg-primary/20 animate-pulse',
            {
              'inset-0.5': size === 'sm',
              'inset-1': size === 'md',
              'inset-1.5': size === 'lg',
              'inset-2': size === 'xl'
            }
          )}
          style={{
            animationDuration: '2s'
          }}
        />
      </div>
      {text && (
        <div className="text-sm text-muted-foreground animate-pulse font-medium">
          {text}
        </div>
      )}
    </div>
  );
}

interface ProcessingLoaderProps {
  stage: 'uploading' | 'processing' | 'analyzing';
  fileName?: string;
  progress?: number;
  className?: string;
}

export function ProcessingLoader({ stage, fileName, progress, className }: ProcessingLoaderProps) {
  const stageMessages = {
    uploading: 'Uploading file...',
    processing: fileName?.toLowerCase().includes('.pdf') ? 'Extracting PDF content with enhanced parser...' : 'Processing image with optimized OCR...',
    analyzing: 'Analyzing medical report with advanced AI...'
  };

  const stageDescriptions = {
    uploading: 'Securely transferring your file',
    processing: fileName?.toLowerCase().includes('.pdf') ? 
      'Using advanced PDF parsing for accurate text extraction' : 
      'Applying optimized OCR techniques for faster image processing',
    analyzing: 'AI is carefully analyzing your medical data for comprehensive insights'
  };

  const stageIcons = {
    uploading: '📤',
    processing: fileName?.toLowerCase().includes('.pdf') ? '📄' : '🔍',
    analyzing: '🧠'
  };

  // Simulated progress for better UX
  const getSimulatedProgress = () => {
    if (typeof progress === 'number') return progress;
    
    switch (stage) {
      case 'uploading': return 25;
      case 'processing': return 65;
      case 'analyzing': return 90;
      default: return 0;
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-6', className)}>
      {/* Main spinner */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-muted animate-spin"
             style={{
               borderTopColor: 'hsl(var(--primary))',
               animationDuration: '1.2s'
             }} 
        />
        <div className="absolute inset-3 rounded-full border-2 border-primary/30 animate-ping"
             style={{ animationDuration: '2s' }} 
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {stageIcons[stage]}
        </div>
      </div>

      {/* Progress info */}
      <div className="text-center space-y-2 max-w-md">
        <div className="text-lg font-medium text-foreground">
          {stageMessages[stage]}
        </div>
        <div className="text-sm text-muted-foreground">
          {stageDescriptions[stage]}
        </div>
        {fileName && (
          <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full inline-block">
            📁 {fileName}
          </div>
        )}
        
        {/* Enhanced progress bar */}
        <div className="w-64 bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${getSimulatedProgress()}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {getSimulatedProgress()}% complete
        </div>
      </div>

      {/* Processing tips */}
      <div className="text-xs text-muted-foreground text-center max-w-sm">
        {stage === 'processing' && fileName?.toLowerCase().includes('.pdf') && (
          <div className="space-y-1">
            <div>✨ Enhanced PDF parsing for better text extraction</div>
            <div>🔧 Improved accuracy for medical documents</div>
          </div>
        )}
        {stage === 'processing' && fileName && !fileName.toLowerCase().includes('.pdf') && (
          <div className="space-y-1">
            <div>🚀 Optimized OCR processing for faster results</div>
            <div>🎯 Specialized for medical report text recognition</div>
          </div>
        )}
        {stage === 'analyzing' && (
          <div className="space-y-1">
            <div>🔍 AI analyzing medical terminology and values</div>
            <div>📊 Generating comprehensive insights and recommendations</div>
          </div>
        )}
      </div>

      {/* Animated dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    </div>
  );
}