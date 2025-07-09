'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiShield, FiCheck, FiX } from 'react-icons/fi';

export default function TwoFactorSetupPage() {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEnable2FA = async () => {
    try {
      const response = await fetch('/api/user/2fa/setup', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setQrCode(data.qrCode);
      setStep('qr');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to enable 2FA');
    }
  };

  const handleVerify = async () => {
    try {
      const response = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess(true);
      setStep('verify');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid verification code');
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          {step === 'intro' && (
            <div className="text-center">
              <FiShield className="mx-auto h-12 w-12 text-indigo-600" />
              <h2 className="mt-2 text-lg font-medium text-gray-900">Two-Factor Authentication</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add an extra layer of security to your account by requiring both a password and an authentication code.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleEnable2FA}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">Scan QR Code</h2>
              <p className="mt-1 text-sm text-gray-500">
                Scan this QR code with your authenticator app (like Google Authenticator or Authy).
              </p>
              <div className="mt-4 flex justify-center">
                <QRCodeSVG value={qrCode} size={200} />
              </div>
              <div className="mt-6">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleVerify}
                  className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="text-center">
              {success ? (
                <div>
                  <FiCheck className="mx-auto h-12 w-12 text-green-500" />
                  <h2 className="mt-2 text-lg font-medium text-gray-900">2FA Enabled</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Two-factor authentication has been successfully enabled for your account.
                  </p>
                </div>
              ) : (
                <div>
                  <FiX className="mx-auto h-12 w-12 text-red-500" />
                  <h2 className="mt-2 text-lg font-medium text-gray-900">Verification Failed</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    The verification code you entered was incorrect. Please try again.
                  </p>
                  <button
                    onClick={() => setStep('qr')}
                    className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiX className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 