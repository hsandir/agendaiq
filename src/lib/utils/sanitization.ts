import DOMPurify from 'isomorphic-dompurify';

// Basic HTML sanitization for user input
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'li', 'ol'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

// Strip all HTML and return plain text
export function sanitizePlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

// Sanitize meeting data
export function sanitizeMeetingData(data: any) {
  const sanitized: any = {};
  
  if (data.title) {
    sanitized.title = sanitizePlainText(data.title).trim();
  }
  
  if (data.description) {
    sanitized.description = sanitizeHtml(data.description).trim();
  }
  
  if (data.agenda) {
    sanitized.agenda = sanitizeHtml(data.agenda).trim();
  }
  
  if (data.notes) {
    sanitized.notes = sanitizeHtml(data.notes).trim();
  }
  
  // Pass through other fields that don't need sanitization
  if (data.startTime) sanitized.startTime = data.startTime;
  if (data.endTime) sanitized.endTime = data.endTime;
  if (data.status) sanitized.status = data.status;
  if (data.attendeeIds) sanitized.attendeeIds = data.attendeeIds;
  if (data.zoomLink) {
    // Validate zoom link format
    const zoomRegex = /^https:\/\/([\w-]+\.)?zoom\.us\/(j|s|w)\/[\w-]+/;
    if (zoomRegex.test(data.zoomLink)) {
      sanitized.zoomLink = data.zoomLink;
    }
  }
  
  return sanitized;
}

// Sanitize agenda item data
export function sanitizeAgendaItemData(data: any) {
  const sanitized: any = {};
  
  if (data.topic) {
    sanitized.topic = sanitizePlainText(data.topic).trim();
  }
  
  if (data.problem_statement) {
    sanitized.problem_statement = sanitizeHtml(data.problem_statement).trim();
  }
  
  if (data.proposed_solution) {
    sanitized.proposed_solution = sanitizeHtml(data.proposed_solution).trim();
  }
  
  if (data.decisions_actions) {
    sanitized.decisions_actions = sanitizeHtml(data.decisions_actions).trim();
  }
  
  // Pass through other fields
  if (data.status) sanitized.status = data.status;
  if (data.priority) sanitized.priority = data.priority;
  if (data.purpose) sanitized.purpose = data.purpose;
  if (data.responsible_staff_id !== undefined) {
    sanitized.responsible_staff_id = data.responsible_staff_id;
  }
  
  return sanitized;
}

// Validate and sanitize Zoom meeting ID
export function validateZoomMeetingId(input: string): string | null {
  // Remove any non-numeric characters
  const cleaned = input.replace(/\D/g, '');
  
  // Zoom meeting IDs are typically 9-11 digits
  if (cleaned.length >= 9 && cleaned.length <= 11) {
    return cleaned;
  }
  
  return null;
}