
import type { Message } from "../../types/chat/chat.types";

export async function sendMessage(messages: Pick<Message, 'role' | 'content'>[]) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) throw new Error('Failed to send message');

  const data = await res.json();
  return data as string;
}