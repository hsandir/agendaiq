import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance factory
export const getPusherClient = () => {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
};

// Channel names
export const CHANNELS = {
  meeting: (meetingId: number) => `private-meeting-${meetingId}`,
  presence: (meetingId: number) => `presence-meeting-${meetingId}`,
};

// Event names
export const EVENTS = {
  AGENDA_ITEM_UPDATED: 'agenda-item-updated',
  AGENDA_ITEM_ADDED: 'agenda-item-added',
  AGENDA_ITEM_DELETED: 'agenda-item-deleted',
  USER_TYPING: 'user-typing',
  USER_STOPPED_TYPING: 'user-stopped-typing',
  MEETING_STATUS_CHANGED: 'meeting-status-changed',
};