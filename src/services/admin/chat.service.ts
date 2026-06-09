
import type { ChatMessage } from "../../types/chat/chat";

export async function sendMessage(messages: Pick<ChatMessage, 'role' | 'content'>[]) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) throw new Error('Failed to send message');

  const data = await res.json();
  return data as string;
}