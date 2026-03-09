import { useState, useEffect, useRef } from 'react';
import { useSignalRConnection } from '@/providers/SignalRProvider';
import { chatHub, SIGNALR_EVENTS } from '@/lib/signalr';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export function useTypingIndicators(conversationId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const signalRContext = useSignalRConnection();
  const isConnected = signalRContext?.isConnected ?? false;
  const conversationIdRef = useRef(conversationId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Clear typing users when conversation changes
  useEffect(() => {
    setTypingUsers([]);
  }, [conversationId]);

  useEffect(() => {
    if (!isConnected || !conversationId) return;

    const cleanupTyping = chatHub.onWithCleanup(
      SIGNALR_EVENTS.USER_TYPING,
      (event: any) => {
        if (event.conversationId !== conversationIdRef.current) return;
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === event.userId);
          if (existing) {
            return prev.map((u) =>
              u.userId === event.userId ? { ...u, timestamp: Date.now() } : u,
            );
          }
          return [...prev, { userId: event.userId, userName: event.userName || '', timestamp: Date.now() }];
        });
      },
      false,
    );

    const cleanupStopped = chatHub.onWithCleanup(
      SIGNALR_EVENTS.USER_STOPPED_TYPING,
      (event: any) => {
        if (event.conversationId !== conversationIdRef.current) return;
        setTypingUsers((prev) => prev.filter((u) => u.userId !== event.userId));
      },
      false,
    );

    return () => {
      cleanupTyping();
      cleanupStopped();
    };
  }, [isConnected, conversationId]);

  // Cleanup stale indicators (3s timeout)
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => prev.filter((u) => Date.now() - u.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { typingUsers };
}
