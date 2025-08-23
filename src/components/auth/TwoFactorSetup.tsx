"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function TwoFactorSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");

  const startSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/setup");
      const data = await response.json();

      if (!response?.ok) {
        throw new Error(data?.error || "Failed to setup 2FA");
      }

      setQrCode(data?.qrCode);
      setManualKey(data?.manualEntryKey);
      setStep('verify');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await response.json();

      if (!response?.ok) {
        throw new Error(data?.error || "Failed to verify code");
      }

      setBackupCodes(data?.backup_codes);
      setStep('complete');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `AgendaIQ Backup Codes\n\nThese codes can be used to access your account if you lose access to your authenticator app.\nEach code can only be used once.\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agendaiq-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Enable Two-Factor Authentication</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          onClick={startSetup}
          disabled={isLoading}
          className="bg-primary text-foreground px-4 py-2 rounded-md hover:bg-primary disabled:opacity-50"
        >
          {isLoading ? "Setting up..." : "Enable 2FA"}
        </button>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Scan QR Code</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your authenticator app to scan this QR code.
          </p>
        </div>

        {qrCode && (
          <div className="flex justify-center">
            <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-foreground">Manual entry key:</p>
          <code className="mt-1 block bg-muted p-2 rounded text-xs break-all">
            {manualKey}
          </code>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Enter verification code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target?.value)}
            placeholder="000000"
            maxLength={6}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={verifyCode}
            disabled={isLoading ?? verificationCode.length !== 6}
            className="bg-primary text-foreground px-4 py-2 rounded-md hover:bg-primary disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify and Enable"}
          </button>
          <button
            onClick={() => {
              setStep('setup');
              setError("");
            }}
            className="bg-muted text-foreground px-4 py-2 rounded-md hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-green-50 p-4">
        <h3 className="text-sm font-medium text-green-800">
          Two-Factor Authentication Enabled Successfully!
        </h3>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground">Backup Codes</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
        </p>
        
        <div className="mt-3 bg-muted p-4 rounded-md">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index}>{code}</div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={downloadBackupCodes}
            className="bg-primary text-foreground px-4 py-2 rounded-md hover:bg-primary"
          >
            Download Codes
          </button>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="bg-muted text-foreground px-4 py-2 rounded-md hover:bg-muted"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}