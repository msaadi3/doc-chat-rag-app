'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  documentContext?: string[];
}

interface ChatInterfaceProps {
  uploadedFiles: File[];
  className?: string;
}

export function ChatInterface({
  uploadedFiles,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content:
        "Hello! I'm your document assistant. Upload some documents and ask me questions about them. I can help you analyze, summarize, and extract information from your files.",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/rag/query', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from backend');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer ?? "Sorry, I couldn't find an answer.",
        role: 'assistant',
        timestamp: new Date(),
        documentContext:
          uploadedFiles.length > 0
            ? uploadedFiles.map((f) => f.name)
            : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending query:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: '⚠️ Error: Could not connect to the backend.',
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Chat Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 max-w-4xl',
              message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className='h-8 w-8 flex-shrink-0'>
              <AvatarFallback
                className={cn(
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-accent-foreground'
                )}
              >
                {message.role === 'user' ? (
                  <User className='h-4 w-4' />
                ) : (
                  <Bot className='h-4 w-4' />
                )}
              </AvatarFallback>
            </Avatar>

            <div
              className={cn(
                'flex flex-col gap-1',
                message.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <Card
                className={cn(
                  'p-3 max-w-2xl',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                )}
              >
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                  {message.content}
                </p>
              </Card>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className='flex gap-3 max-w-4xl mr-auto'>
            <Avatar className='h-8 w-8 flex-shrink-0'>
              <AvatarFallback className='bg-accent text-accent-foreground'>
                <Bot className='h-4 w-4' />
              </AvatarFallback>
            </Avatar>
            <Card className='p-3'>
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='text-sm text-muted-foreground'>
                  Analyzing documents...
                </span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className='border-t bg-background p-4'>
        <form onSubmit={handleSubmit} className='flex gap-2'>
          <div className='flex-1 relative'>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                uploadedFiles.length > 0
                  ? 'Ask me anything about your documents...'
                  : 'Upload documents first, then ask me questions about them...'
              }
              className='min-h-[44px] max-h-32 resize-none pr-12'
              disabled={isLoading}
            />
            <Button
              type='submit'
              size='sm'
              disabled={!input.trim() || isLoading}
              className='absolute right-2 bottom-2 h-8 w-8 p-0'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </form>

        {uploadedFiles.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {uploadedFiles.map((file, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-1 rounded-md bg-accent/10 text-accent text-xs'
              >
                {file.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
