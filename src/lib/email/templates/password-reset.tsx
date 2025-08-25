import React from 'react';
import { BaseEmailTemplate } from './base';
import { PasswordResetData } from '../types';

interface PasswordResetTemplateProps {
  data: PasswordResetData
}

export function PasswordResetTemplate({ data }: PasswordResetTemplateProps) {
  const { _userName, _resetUrl, _expiresIn } = data;

  return (
    <BaseEmailTemplate
      title="Password Reset - AgendaIQ"
      previewText="Reset your AgendaIQ account password"
    >
      <h2 style={{ color: '#374151', marginTop: 0 }}>
        🔑 Password Reset Request
      </h2>
      
      <p style={{ fontSize: '16px', marginBottom: '24px' }}>
        Hello {userName},
      </p>

      <p style={{ marginBottom: '24px' }}>
        We received a request to reset the password for your AgendaIQ account. 
        Click the button below to create a new password for your account.
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={resetUrl} className="btn">
          🔓 Reset My Password
        </a>
      </div>

      <div className="highlight">
        <p style={{ margin: '0', fontSize: '14px' }}>
          <strong>⏰ Important:</strong> This password reset link will expire in {expiresIn}. 
          If you need to reset your password after this time, please request a new reset link.
        </p>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>
          Can't click the button? Copy and paste this link:
        </p>
        <p style={{ 
          margin: '0', 
          fontSize: '14px', 
          wordBreak: 'break-all', 
          color: '#6b7280',
          backgroundColor: '#ffffff',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb'
        }}>
          {resetUrl}
        </p>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#b91c1c' }}>
          🚨 Security Notice
        </h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#b91c1c' }}>
          If you did not request a password reset, please ignore this email and consider changing 
          your password as a precautionary measure. Your current password remains unchanged.
        </p>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h4 style={{ color: '#374151', marginBottom: '12px' }}>
          🛡️ Security Tips:
        </h4>
        <ul style={{ color: '#6b7280', paddingLeft: '20px', fontSize: '14px' }}>
          <li>Choose a strong password with at least 8 characters</li>
          <li>Include uppercase and lowercase letters, numbers, and symbols</li>
          <li>Don't reuse passwords from other accounts</li>
          <li>Consider using a password manager</li>
          <li>Enable two-factor authentication for extra security</li>
        </ul>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
        <p style={{ margin: '0', fontSize: '14px', color: '#1e40af' }}>
          <strong>💡 Tip:</strong> After resetting your password, we recommend reviewing your 
          account security settings and recent login activity in your dashboard.
        </p>
      </div>

      <p style={{ marginTop: '32px', color: '#6b7280', fontSize: '14px' }}>
        If you continue to have trouble accessing your account, contact our support team at info@agendaiq.app
      </p>
    </BaseEmailTemplate>
  );
}