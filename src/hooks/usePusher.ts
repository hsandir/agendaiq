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
      pusherRef.current = getPusherClient();
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
  eventHandlers?: Record<string, (data: any) => void>
) {
  const pusher = usePusher();
  const [channel, setChannel] = useState<Channel | null>(null);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!pusher || !channelName) return;

    // Subscribe to channel
    channelRef.current = pusher.subscribe(channelName);
    setChannel(channelRef.current);

    // Bind event handlers
    if (eventHandlers) {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        channelRef.current?.bind(event, handler);
      });
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        // Unbind event handlers
        if (eventHandlers) {
          Object.entries(eventHandlers).forEach(([event, handler]) => {
            channelRef.current?.unbind(event, handler);
          });
        }
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [pusher, channelName, eventHandlers]);

  return channel;
}

export function usePresenceChannel(
  channelName: string | null,
  eventHandlers?: Record<string, (data: any) => void>
) {
  const pusher = usePusher();
  const [channel, setChannel] = useState<PresenceChannel | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const channelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    if (!pusher || !channelName) return;

    // Subscribe to presence channel
    channelRef.current = pusher.subscribe(channelName) as PresenceChannel;
    setChannel(channelRef.current);

    // Handle presence events
    channelRef.current.bind('pusher:subscription_succeeded', () => {
      const membersList = Object.values(channelRef.current?.members.members || {});
      setMembers(membersList);
    });

    channelRef.current.bind('pusher:member_added', (member: any) => {
      setMembers(prev => [...prev, member]);
    });

    channelRef.current.bind('pusher:member_removed', (member: any) => {
      setMembers(prev => prev.filter(m => m.id !== member.id));
    });

    // Bind custom event handlers
    if (eventHandlers) {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        channelRef.current?.bind(event, handler);
      });
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        // Unbind all events
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [pusher, channelName, eventHandlers]);

  return { channel, members };
}