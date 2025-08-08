// Pusher functionality temporarily disabled for performance optimization
// Will be replaced with WebSocket or Server-Sent Events

// Mock Pusher server (does nothing)
export const pusherServer = {
  trigger: async (channel: string, event: string, data: any) => {
    // No-op - real-time features temporarily disabled
    return Promise.resolve();
  },
  authorizeChannel: (socketId: string, channel: string, presenceData?: any) => {
    // Mock authorization - return a mock auth response
    return {
      auth: `${socketId}:mock-auth-signature`,
      channel_data: presenceData ? JSON.stringify(presenceData) : undefined
    };
  }
};

// Mock Pusher client factory
export const getPusherClient = () => {
  return {
    subscribe: (channel: string) => ({
      bind: (event: string, callback: Function) => {},
      unbind: (event: string) => {},
      unsubscribe: () => {}
    }),
    unsubscribe: (channel: string) => {},
    disconnect: () => {}
  };
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