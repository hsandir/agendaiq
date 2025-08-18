'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TwoFactorFormProps {
  userId?: string;
  onSuccess?: () => void;
}

export default function TwoFactorForm({ userId, onSuccess }: TwoFactorFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [showBackupOption, setShowBackupOption] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Check if code contains only numbers
    if (!/^\d*$/.test(code)) {
      setError('Code must contain only numbers');
      return;
    }
    
    if (showBackupOption && code.length !== 8) {
      setError('Backup code must be 8 digits');
      return;
    } else if (!showBackupOption && code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }
    
    setIsLoading(true);

    try {
      // Import signIn from next-auth/react
      const { __signIn  } = await import('next-auth/react');
      
      const result = await signIn('credentials', {
        email,
        twoFactorCode: code,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid verification code');
      } else if (result?.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (error: unknown) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    if (resendCount >= 3) {
      setError('Too many resend attempts. Please try again later.');
      return;
    }
    
    setIsResending(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          setError('Please wait before requesting another code');
        } else {
          setError(data.error || 'Failed to resend code');
        }
      } else {
        setResendCount(resendCount + 1);
        setSuccessMessage('New code sent!');
      }
    } catch (error: unknown) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          {showBackupOption 
            ? 'Enter your 8-character backup code' 
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-foreground">
          {showBackupOption ? 'Backup Code' : 'Verification Code'}
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, showBackupOption ? 8 : 6))}
          placeholder={showBackupOption ? "12345678" : "000000"}
          maxLength={showBackupOption ? 8 : 6}
          pattern={showBackupOption ? "[0-9]{8}" : "[0-9]{6}"}
          required
          autoFocus
          className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-blue-500 text-center text-2xl tracking-wider"
        />
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isResending || resendCount >= 3}
          className="text-primary hover:text-primary disabled:text-muted-foreground"
        >
          {isResending ? 'Resending...' : 'Resend code'}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setShowBackupOption(!showBackupOption);
            setCode('');
            setError('');
          }}
          className="text-primary hover:text-primary"
        >
          {showBackupOption ? 'Use authenticator app' : 'Use backup code'}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-foreground bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
      >
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>
    </form>
  );
}