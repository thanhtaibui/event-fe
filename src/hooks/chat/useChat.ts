// hooks/useChat.ts
import { useState, useCallback } from 'react';
import type { Message } from '../../types/chat/chat.types';
import { sendMessage } from '../../services/admin/chat.service';


export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: uuid(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await sendMessage(history);

      const assistantMsg: Message = {
        id: uuid(),
        role: 'assistant',
        content: reply,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, clear };
}

function uuid(): string {
  throw new Error('Function not implemented.');
}
