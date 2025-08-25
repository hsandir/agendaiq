export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  cid?: string;
}

export interface BaseEmailData {
  to: string | string[];
  subject: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface MeetingInviteData extends BaseEmailData {
  meetingTitle: string;
  meetingDescription?: string;
  startTime: string;
  endTime: string;
  location?: string;
  organizer: {
    name: string;
    email: string
  };
  attendees: Array<{
    name: string;
    email: string;
    role?: string;
  }>;
  meetingUrl?: string;
  agendaItems?: Array<{
    title: string;
    description?: string;
    duration?: number;
  }>;
}

export interface TeamNotificationData extends BaseEmailData {
  teamName: string;
  actionType: 'created' | 'updated' | 'member_added' | 'member_removed' | 'role_changed';
  actor: {
    name: string;
    email: string
  };
  teamUrl: string;
  message?: string;
  details?: Record<string, any>;
}

export interface PasswordResetData extends BaseEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string
}

export interface VerificationEmailData extends BaseEmailData {
  userName: string;
  verificationUrl: string;
  expiresIn: string
}

export interface EmailNotificationData extends BaseEmailData {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export type EmailTemplateData = 
  | MeetingInviteData
  | TeamNotificationData 
  | PasswordResetData
  | VerificationEmailData
  | EmailNotificationData;