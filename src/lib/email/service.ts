import { render } from '@react-email/render';
import { createTransporter, emailConfig, validateEmailConfig } from './config';
import { 
  EmailTemplateData, 
  MeetingInviteData, 
  TeamNotificationData, 
  PasswordResetData, 
  VerificationEmailData,
  EmailNotificationData,
  BaseEmailData
} from './types';
// Dynamic imports to avoid build issues
const getMeetingInviteTemplate = () => import('./templates/meeting-invite').then(m => m.MeetingInviteTemplate);
const getTeamNotificationTemplate = () => import('./templates/team-notification').then(m => m.TeamNotificationTemplate);
const getPasswordResetTemplate = () => import('./templates/password-reset').then(m => m.PasswordResetTemplate);
const getVerificationTemplate = () => import('./templates/verification').then(m => m.VerificationTemplate);

export class EmailService {
  private static instance: EmailService;
  private transporter: ReturnType<typeof createTransporter> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async getTransporter() {
    if (!this.transporter) {
      validateEmailConfig();
      this.transporter = createTransporter();
    }
    return this.transporter;
  }

  private async renderTemplate(data: EmailTemplateData): Promise<{ html: string; text: string }> {
    let html: string;
    
    if ('meetingTitle' in data) {
      const MeetingInviteTemplate = await getMeetingInviteTemplate();
      html = render(MeetingInviteTemplate({ data: data as MeetingInviteData }));
    } else if ('teamName' in data) {
      const TeamNotificationTemplate = await getTeamNotificationTemplate();
      html = render(TeamNotificationTemplate({ data: data as TeamNotificationData }));
    } else if ('resetUrl' in data) {
      const PasswordResetTemplate = await getPasswordResetTemplate();
      html = render(PasswordResetTemplate({ data: data as PasswordResetData }));
    } else if ('verificationUrl' in data) {
      const VerificationTemplate = await getVerificationTemplate();
      html = render(VerificationTemplate({ data: data as VerificationEmailData }));
    } else {
      // Fallback for generic notifications
      const notificationData = data as EmailNotificationData;
      html = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${notificationData.title}</h2>
              <p>${notificationData.message}</p>
              ${notificationData.actionUrl ? `<a href="${notificationData.actionUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${notificationData.actionText || 'Take Action'}</a>` : ''}
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 14px;">© ${new Date().getFullYear()} AgendaIQ. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;
    }

    // Generate plain text version
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return { html, text };
  }

  async sendEmail(data: EmailTemplateData): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const { html, text } = await this.renderTemplate(data);

      const mailOptions = {
        from: {
          name: emailConfig.from.name,
          address: emailConfig.from.address,
        },
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        cc: data.cc ? (Array.isArray(data.cc) ? data.cc.join(', ') : data.cc) : undefined,
        bcc: data.bcc ? (Array.isArray(data.bcc) ? data.bcc.join(', ') : data.bcc) : undefined,
        replyTo: emailConfig.replyTo,
        subject: data.subject,
        html,
        text,
        attachments: data.attachments,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMeetingInvite(data: MeetingInviteData): Promise<void> {
    await this.sendEmail(data);
  }

  async sendTeamNotification(data: TeamNotificationData): Promise<void> {
    await this.sendEmail(data);
  }

  async sendPasswordReset(data: PasswordResetData): Promise<void> {
    await this.sendEmail(data);
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    await this.sendEmail(data);
  }

  async sendNotification(data: EmailNotificationData): Promise<void> {
    await this.sendEmail(data);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();