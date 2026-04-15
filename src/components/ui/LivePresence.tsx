"use client";

import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useAuth } from "@/context/AuthContext";
import { Users, Edit3 } from "lucide-react";
import { useEffect } from "react";

interface LivePresenceProps {
  roomId: string;
  isTyping?: boolean; // We pass this from the parent if the current user is typing
}

export default function LivePresence({ roomId, isTyping }: LivePresenceProps) {
  const { user } = useAuth();
  const { onlineUsers, updateTypingStatus } = useRealtimePresence(roomId, user);

  useEffect(() => {
    updateTypingStatus(!!isTyping);
  }, [isTyping, updateTypingStatus]);

  if (!onlineUsers || onlineUsers.length === 0) return null;

  // We filter out the current user if we want, or keep it to show "You are online"
  // Usually, it's nice to see yourself and others.
  
  const typingUsers = onlineUsers.filter(u => u.isTyping && u.id !== user?.id);

  return (
    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((u) => (
            <div
              key={u.id}
              title={u.name + (u.id === user?.id ? " (أنت)" : "")}
              className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shrink-0 bg-[var(--color-primary)] text-white relative`}
            >
              {u.name.charAt(0)}
              {/* Online Indicator */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold bg-gray-100 text-gray-500 shrink-0">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </div>
      
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 border-r border-gray-100 pr-3">
          <Edit3 className="w-3 h-3 animate-pulse text-[var(--color-primary)]" />
          <span className="animate-pulse">
            {typingUsers.map(u => u.name.split(' ')[0]).join(' و ')} {typingUsers.length > 1 ? "يكتبون الآن..." : "يكتب الآن..."}
          </span>
        </div>
      )}
    </div>
  );
}
