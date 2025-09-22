'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Chrome } from 'lucide-react';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center space-y-4'>
          <div className='mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center'>
            <FileText className='h-6 w-6 text-accent-foreground' />
          </div>
          <div>
            <CardTitle className='text-2xl font-bold'>Document Chat</CardTitle>
            <CardDescription className='text-base'>
              Sign in to start chatting with your documents
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className='w-full h-11 bg-transparent'
            variant='outline'
          >
            <Chrome className='mr-2 h-4 w-4' />
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
