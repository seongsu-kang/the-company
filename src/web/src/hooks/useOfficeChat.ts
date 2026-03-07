/* =========================================================
   useOfficeChat — Office Chat channel management

   Manages chat channels + routes ambient speech & dispatch
   events to appropriate channels. Persists to localStorage.
   ========================================================= */

import { useCallback, useEffect, useState } from 'react';
import type { ChatChannel, ChatMessage } from '../types/chat';

const LS_KEY = 'tycono:office-chat';
const MAX_MESSAGES = 200; // per channel

let _msgId = 0;
function nextMsgId(): string {
  return `chat-${Date.now()}-${++_msgId}`;
}

function loadChannels(): ChatChannel[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatChannel[];
      // Ensure #office exists
      if (!parsed.find(c => c.id === 'office')) {
        parsed.unshift(makeOfficeChannel());
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return [makeOfficeChannel()];
}

function makeOfficeChannel(): ChatChannel {
  return { id: 'office', name: '#office', members: [], isDefault: true, messages: [] };
}

function saveChannels(channels: ChatChannel[]) {
  // Trim messages before saving
  const trimmed = channels.map(ch => ({
    ...ch,
    messages: ch.messages.slice(-MAX_MESSAGES),
  }));
  localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
}

export interface UseOfficeChatReturn {
  channels: ChatChannel[];
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
  /** Push a chat message to relevant channels */
  pushMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  /** Create a new channel */
  createChannel: (name: string, members: string[]) => void;
  /** Delete a channel (not #office) */
  deleteChannel: (id: string) => void;
  /** Add/remove members from a channel */
  updateMembers: (channelId: string, members: string[]) => void;
}

export function useOfficeChat(): UseOfficeChatReturn {
  const [channels, setChannels] = useState<ChatChannel[]>(loadChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Save on change
  useEffect(() => {
    saveChannels(channels);
  }, [channels]);

  const pushMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    const fullMsg: ChatMessage = { ...msg, id: nextMsgId() };

    setChannels(prev => prev.map(ch => {
      // #office gets everything
      if (ch.id === 'office') {
        return { ...ch, messages: [...ch.messages, fullMsg].slice(-MAX_MESSAGES) };
      }
      // Custom channels: only if sender or partner is a member
      if (ch.members.length > 0) {
        const isMember = ch.members.includes(msg.roleId) ||
          (msg.partnerId && ch.members.includes(msg.partnerId)) ||
          (msg.targetRoleId && ch.members.includes(msg.targetRoleId));
        if (isMember) {
          return { ...ch, messages: [...ch.messages, fullMsg].slice(-MAX_MESSAGES) };
        }
      }
      return ch;
    }));
  }, []);

  const createChannel = useCallback((name: string, members: string[]) => {
    const id = `ch-${Date.now()}`;
    const channel: ChatChannel = {
      id,
      name: name.startsWith('#') ? name : `#${name}`,
      members,
      isDefault: false,
      messages: [],
    };
    setChannels(prev => [...prev, channel]);
    setActiveChannelId(id);
  }, []);

  const deleteChannel = useCallback((id: string) => {
    setChannels(prev => prev.filter(ch => ch.id !== id || ch.isDefault));
    setActiveChannelId(prev => prev === id ? 'office' : prev);
  }, []);

  const updateMembers = useCallback((channelId: string, members: string[]) => {
    setChannels(prev => prev.map(ch =>
      ch.id === channelId && !ch.isDefault ? { ...ch, members } : ch,
    ));
  }, []);

  return {
    channels,
    activeChannelId,
    setActiveChannelId,
    pushMessage,
    createChannel,
    deleteChannel,
    updateMembers,
  };
}
