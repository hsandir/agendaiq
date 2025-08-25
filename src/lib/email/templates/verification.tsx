import React from 'react';
import { BaseEmailTemplate } from './base';
import { VerificationEmailData } from '../types';

interface VerificationTemplateProps {
  data: VerificationEmailData;
}

export function VerificationTemplate({ data }: VerificationTemplateProps) {
  const { userName, verificationUrl, expiresIn } = data;

  return (
    <BaseEmailTemplate
      title="Verify Your Email - AgendaIQ"
      previewText="Please verify your email address to complete your AgendaIQ account setup"
    >
      <h2 style={{ color: '#374151', marginTop: 0 }}>
        ✉️ Email Verification Required
      </h2>
      
      <p style={{ fontSize: '16px', marginBottom: '24px' }}>
        Hello {userName},
      </p>

      <p style={{ marginBottom: '24px' }}>
        Thank you for signing up for AgendaIQ! To complete your account setup and ensure the security 
        of your account, please verify your email address by clicking the button below.
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={verificationUrl} className="btn">
          ✅ Verify Email Address
        </a>
      </div>

      <div className="highlight">
        <p style={{ margin: '0', fontSize: '14px' }}>
          <strong>⏰ Important:</strong> This verification link will expire in {expiresIn}. 
          If the link expires, you can request a new verification email from the login page.
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
          {verificationUrl}
        </p>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>
          🔒 Security Notice
        </h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#92400e' }}>
          If you did not create an account with AgendaIQ, please ignore this email. 
          Your email address will not be used for any AgendaIQ services unless verified.
        </p>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h4 style={{ color: '#374151', marginBottom: '12px' }}>
          What happens after verification?
        </h4>
        <ul style={{ color: '#6b7280', paddingLeft: '20px' }}>
          <li>Access to your AgendaIQ dashboard</li>
          <li>Ability to create and join meetings</li>
          <li>Team collaboration features</li>
          <li>Meeting notifications and reminders</li>
        </ul>
      </div>

      <p style={{ marginTop: '32px', color: '#6b7280', fontSize: '14px' }}>
        Need help? Contact our support team at info@agendaiq.app
      </p>
    </BaseEmailTemplate>
  );
}