import { Resend } from 'resend';
import { Logger } from '@/lib/utils/logger';

let resend: Resend | null = null;

// Initialize Resend only if API key is available
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    Logger.warn('RESEND_API_KEY not found in environment variables. Email functionality will be disabled.', {}, 'email-service');
  }
} catch (error) {
  Logger.error('Failed to initialize Resend', { error: String(error) }, 'email-service');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (!resend) {
      Logger.warn('Email service not configured or disabled', { to }, 'email-service');
      return { success: false, error: 'Email service not configured' };
    }

    const data = await resend.emails.send({
      from: 'AgendaIQ <noreply@agendaiq.com>',
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    Logger.error('Error sending email', { error: String(error), to, subject }, 'email-service');
    return { success: false, error };
  }
}

export function getVerificationEmailHtml(verificationLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify your email address</h2>
      <p>Click the button below to verify your email address:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Verify Email
      </a>
      <p>If you didn't request this verification, you can safely ignore this email.</p>
    </div>
  `;
}

export function getLoginNotificationHtml(deviceInfo: { browser: string; os: string; location: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Login Detected</h2>
      <p>We detected a new login to your AgendaIQ account from a new device:</p>
      <ul style="list-style: none; padding: 0;">
        <li>Browser: ${deviceInfo.browser}</li>
        <li>Operating System: ${deviceInfo.os}</li>
        <li>Location: ${deviceInfo.location}</li>
      </ul>
      <p>If this wasn't you, please change your password immediately and contact support.</p>
    </div>
  `;
}

export function getTwoFactorCodeHtml(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Two-Factor Authentication Code</h2>
      <p>Use the following code to complete your login:</p>
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 6px; text-align: center; font-size: 24px; letter-spacing: 4px; margin: 16px 0;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;
}

export function getPasswordResetHtml(resetLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password for your AgendaIQ account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Reset Password
      </a>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p style="color: #6B7280; font-size: 12px;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        ${resetLink}
      </p>
    </div>
  `;
} 