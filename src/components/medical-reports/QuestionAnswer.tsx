'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, User, Bot, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface QuestionAnswerProps {
  reportText: string;
}

export function QuestionAnswer({ reportText }: QuestionAnswerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = (text: string, isUser: boolean) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim()) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage(question, true);

    try {
      const response = await fetch('/api/medical-reports/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          reportText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get answer: ${response.statusText}`);
      }

      const result = await response.json();
      addMessage(result.answer, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
      addMessage('I apologize, but I encountered an error while processing your question. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the main findings in this report?",
    "Are there any concerning values in my test results?", 
    "What do these medical terms mean?",
    "Should I be worried about any of these results?",
    "What should I discuss with my doctor about this report?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setCurrentQuestion(question);
  };

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          Ask Questions About Your Report
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3 sm:space-y-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 border rounded-lg p-3 sm:p-4">
          {messages.length === 0 ? (
            <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <MessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              <div>
                <h3 className="font-medium text-sm sm:text-base">Ask questions about your report</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  I can help explain medical terms, clarify findings, and answer questions about your report.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs h-8 px-3"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 sm:gap-3 ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!message.isUser && (
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-lg break-words ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap overflow-wrap-anywhere">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.isUser && (
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="bg-muted p-2.5 sm:p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <p className="text-xs sm:text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Suggested Questions (when no messages) */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggested questions:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left h-auto p-2 text-xs justify-start whitespace-normal"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmitQuestion} className="flex gap-2">
          <Input
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Ask a question about your report..."
            disabled={isLoading}
            className="flex-1 h-12 sm:h-10"
          />
          <Button type="submit" disabled={isLoading || !currentQuestion.trim()} className="h-12 w-12 sm:h-10 sm:w-10 p-0 flex-shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
{/*           <p>
            💡 Remember: This AI assistant provides general information only. Always consult your healthcare provider for medical advice.
          </p> */}
        </div>
      </CardContent>
    </Card>
  );
}
