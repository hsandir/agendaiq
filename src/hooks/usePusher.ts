"use client";

import { useEffect, useRef, useState } from 'react';
import { getPusherClient } from '@/lib/pusher';
import type PusherClient from 'pusher-js';
import type { Channel, PresenceChannel } from 'pusher-js';

export function usePusher() {
  const [pusher, setPusher] = useState<PusherClient | null>(null);
  const pusherRef = useRef<PusherClient | null>(null);

  useEffect(() => {
    if (!pusherRef.current) {
      pusherRef.current = getPusherClient() as PusherClient;
      setPusher(pusherRef.current);
    }

    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  return pusher;
}

export function usePusherChannel(
  channelName: string | null,
  eventHandlers?: Record<string, (data: unknown) => void>
) {
  const pusher = usePusher();
  const [channel, setChannel] = useState<Channel | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const handlersRef = useRef(eventHandlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    if (!pusher || !channelName) return;

    // Subscribe to channel
    channelRef.current = pusher.subscribe(channelName);
    setChannel(channelRef.current);

    // Create stable handler functions that use ref
    const stableHandlers: Record<string, (data: unknown) => void> = {};
    if (handlersRef.current) {
      Object.entries(handlersRef.current).forEach(([event, _]) => {
        stableHandlers[event] = (data: unknown) => {
          handlersRef.current?.[event]?.(data);
        };
      });
    }

    // Bind stable handlers
    Object.entries(stableHandlers).forEach(([event, handler]) => {
      channelRef.current?.bind(event, handler);
    });

    // Cleanup
    return () => {
      if (channelRef.current) {
        // Unbind stable handlers
        Object.entries(stableHandlers).forEach(([event, handler]) => {
          channelRef.current?.unbind(event, handler);
        });
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [pusher, channelName]); // Remove eventHandlers from dependencies

  return channel;
}

interface PresenceMember {
  id: string;
  info?: {
    name: string;
    role: string;
    [key: string]: unknown;
  };
}

export function usePresenceChannel(
  channelName: string | null,
  eventHandlers?: Record<string, (data: unknown) => void>
) {
  const pusher = usePusher();
  const [channel, setChannel] = useState<PresenceChannel | null>(null);
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const channelRef = useRef<PresenceChannel | null>(null);
  const handlersRef = useRef(eventHandlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    if (!pusher || !channelName) return;

    // Subscribe to presence channel
    channelRef.current = pusher.subscribe(channelName) as PresenceChannel;
    setChannel(channelRef.current);

    // Handle presence events
    channelRef.current.bind('pusher:subscription_succeeded', () => {
      const membersList = Object.values(channelRef.current?.members.members ?? {}) as PresenceMember[];
      setMembers(membersList.filter((member): member is PresenceMember => 
        typeof member === 'object' && member !== null && 'id' in member
      ));
    });

    channelRef.current.bind('pusher:member_added', (member: PresenceMember) => {
      setMembers(prev => [...prev, member]);
    });

    channelRef.current.bind('pusher:member_removed', (member: PresenceMember) => {
      setMembers(prev => prev.filter(m => m.id !== member.id))
    });

    // Create stable handler functions
    const stableHandlers: Record<string, (data: unknown) => void> = {};
    if (handlersRef.current) {
      Object.entries(handlersRef.current).forEach(([event, _]) => {
        stableHandlers[event] = (data: unknown) => {
          handlersRef.current?.[event]?.(data);
        };
      });
    }

    // Bind stable handlers
    Object.entries(stableHandlers).forEach(([event, handler]) => {
      channelRef.current?.bind(event, handler);
    });

    // Cleanup
    return () => {
      if (channelRef.current) {
        // Unbind all events - check if method exists
        if (typeof channelRef.current.unbind_all === 'function') {
          channelRef.current.unbind_all();
        } else if (typeof channelRef.current.unbind === 'function') {
          // Unbind specific events if unbind_all is not available
          channelRef.current.unbind('pusher:subscription_succeeded');
          channelRef.current.unbind('pusher:member_added');
          channelRef.current.unbind('pusher:member_removed');
          // Unbind stable handlers
          Object.entries(stableHandlers).forEach(([event, handler]) => {
            channelRef.current?.unbind(event, handler);
          });
        }
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [pusher, channelName]); // Remove eventHandlers from dependencies

  return { channel, members };
}