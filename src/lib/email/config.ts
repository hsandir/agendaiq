import nodemailer from 'nodemailer';

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string
    };
  };
  from: {
    name: string;
    address: string
  };
  replyTo: string
}

export const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'info@agendaiq.app',
      pass: process.env.SMTP_AUTH_KEY || '',
    },
  },
  from: {
    name: 'AgendaIQ',
    address: process.env.SMTP_FROM || 'info@agendaiq.app',
  },
  replyTo: process.env.SMTP_REPLY_TO || 'info@agendaiq.app',
};

export const createTransporter = () => {
  if (!emailConfig.smtp.auth.pass) {
    throw new Error('SMTP auth key not configured. Please set SMTP_AUTH_KEY environment variable.');
  }

  return nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.auth.user,
      pass: emailConfig.smtp.auth.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const validateEmailConfig = () => {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_USER', 
    'SMTP_AUTH_KEY',
    'SMTP_FROM'
  ];

  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};