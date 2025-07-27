'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Image, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }

    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return 'Please upload a PDF, image (JPG, PNG, GIF, WebP), or text file';
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
  };

  const confirmUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Medical Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedFile ? (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Drop your file here</h3>
              <p className="text-muted-foreground mb-4">
                Support for PDF, images (JPG, PNG, GIF, WebP), and text files
              </p>
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept={Object.values(ACCEPTED_FILE_TYPES).join(',')}
                    onChange={handleFileInputChange}
                  />
                </label>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Maximum file size: 10MB</p>
              <p>• Supported formats: PDF, JPG, PNG, GIF, WebP, TXT, DOC, DOCX</p>
              <p>• Your files are processed securely and not stored permanently</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {getFileIcon(selectedFile.type)}
              <div className="flex-1">
                <h4 className="font-medium">{selectedFile.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={confirmUpload} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Continue with this file
              </Button>
              <Button variant="outline" onClick={clearSelection}>
                Choose Different File
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}