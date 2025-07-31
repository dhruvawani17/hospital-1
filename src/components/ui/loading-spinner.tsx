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
  const getStageInfo = () => {
    const fileExtension = fileName?.split('.').pop()?.toLowerCase();
    
    switch (stage) {
      case 'uploading':
        return {
          message: 'Uploading file...',
          icon: '📤',
          detail: fileName ? `Processing ${fileName}` : 'Preparing file for analysis'
        };
      case 'processing':
        if (fileExtension === 'pdf') {
          return {
            message: 'Extracting text from PDF...',
            icon: '📄',
            detail: 'Using advanced PDF text extraction'
          };
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
          return {
            message: 'Reading image content...',
            icon: '👁️',
            detail: 'Using OCR and AI vision technology'
          };
        } else {
          return {
            message: 'Processing document...',
            icon: '🔍',
            detail: 'Extracting text content'
          };
        }
      case 'analyzing':
        return {
          message: 'Analyzing medical report...',
          icon: '🧠',
          detail: 'AI is generating insights and summary'
        };
      default:
        return {
          message: 'Processing...',
          icon: '⚙️',
          detail: 'Working on your request'
        };
    }
  };

  const stageInfo = getStageInfo();

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
          {stageInfo.icon}
        </div>
      </div>

      {/* Progress info */}
      <div className="text-center space-y-2">
        <div className="text-lg font-medium text-foreground">
          {stageInfo.message}
        </div>
        <div className="text-sm text-muted-foreground">
          {stageInfo.detail}
        </div>
        {fileName && (
          <div className="text-xs text-muted-foreground font-mono">
            {fileName}
          </div>
        )}
        {typeof progress === 'number' && (
          <div className="w-64 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
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