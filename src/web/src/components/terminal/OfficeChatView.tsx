/* =========================================================
   OfficeChatView — Slack-style chat message list
   Renders ChatMessage[] in a scrollable feed
   ========================================================= */

import { useEffect, useRef } from 'react';
import type { ChatChannel, ChatMessage } from '../../types/chat';

const ROLE_COLORS: Record<string, string> = {
  cto: '#1565C0', cbo: '#E65100', pm: '#2E7D32',
  engineer: '#4A148C', designer: '#AD1457', qa: '#00695C',
  'data-analyst': '#0277BD',
};

const ROLE_NAMES: Record<string, string> = {
  cto: 'CTO', cbo: 'CBO', pm: 'PM',
  engineer: 'Engineer', designer: 'Designer', qa: 'QA',
  'data-analyst': 'Data Analyst',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function ChatMsg({ msg }: { msg: ChatMessage }) {
  const color = ROLE_COLORS[msg.roleId] ?? '#888';
  const name = ROLE_NAMES[msg.roleId] ?? msg.roleId;

  if (msg.type === 'dispatch') {
    const targetName = ROLE_NAMES[msg.targetRoleId ?? ''] ?? msg.targetRoleId;
    return (
      <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02]">
        <span className="text-[10px] text-[var(--terminal-text-muted)] shrink-0 w-10 text-right mt-0.5">
          {formatTime(msg.ts)}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>
            {name} → {targetName}
          </span>
          <span className="text-xs text-[var(--terminal-text-secondary)] ml-2">
            {msg.text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02]">
      <span className="text-[10px] text-[var(--terminal-text-muted)] shrink-0 w-10 text-right mt-0.5">
        {formatTime(msg.ts)}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold mr-1.5" style={{ color }}>
          {name}
        </span>
        {msg.type === 'social' && msg.partnerId && (
          <span className="text-[10px] text-[var(--terminal-text-muted)] mr-1.5">
            → {ROLE_NAMES[msg.partnerId] ?? msg.partnerId}
          </span>
        )}
        <span className={`text-xs ${msg.type === 'guilt' ? 'text-[var(--terminal-text-muted)] italic' : 'text-[var(--terminal-text-secondary)]'}`}>
          {msg.text}
        </span>
      </div>
    </div>
  );
}

interface Props {
  channel: ChatChannel;
}

export default function OfficeChatView({ channel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channel.messages.length]);

  if (channel.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--terminal-text-muted)] text-sm gap-2">
        <span className="text-lg">💬</span>
        <span>{channel.name}</span>
        <span className="text-[10px]">Role conversations will appear here</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto terminal-scrollbar py-2">
      {/* Channel header */}
      <div className="px-3 py-2 mb-2 border-b border-[var(--terminal-border)]">
        <span className="text-sm font-semibold text-[var(--terminal-text)]">{channel.name}</span>
        {channel.members.length > 0 && (
          <span className="text-[10px] text-[var(--terminal-text-muted)] ml-2">
            {channel.members.map(m => ROLE_NAMES[m] ?? m).join(', ')}
          </span>
        )}
        {channel.members.length === 0 && (
          <span className="text-[10px] text-[var(--terminal-text-muted)] ml-2">all roles</span>
        )}
      </div>
      {channel.messages.map(msg => (
        <ChatMsg key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
