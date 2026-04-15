import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppUser } from '@/lib/types';

export interface PresenceUser {
  id: string;
  name: string;
  photoUrl?: string;
  isTyping?: boolean;
}

export function useRealtimePresence(roomId: string, currentUser: AppUser | null | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser || !roomId) return;

    const supabase = createClient();
    const channelName = `presence_${roomId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Map<string, PresenceUser>();
        
        Object.keys(state).forEach((key) => {
          // state[key] is an array of presences for that key (can be multiple tabs)
          const presences = state[key] as any[];
          if (presences.length > 0) {
            // We just take the first one or merge isTyping
            const latest = presences[presences.length - 1];
            users.set(key, {
              id: key,
              name: latest.name,
              photoUrl: latest.photoUrl,
              isTyping: presences.some((p: any) => p.isTyping),
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: currentUser.displayName,
            photoUrl: currentUser.photoURL,
            isTyping: false,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, currentUser]);

  const updateTypingStatus = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !currentUser) return;
    channelRef.current.track({
      name: currentUser.displayName,
      photoUrl: currentUser.photoURL,
      isTyping,
    }).catch(console.error);
  }, [currentUser]);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    updateTypingStatus,
  };
}
