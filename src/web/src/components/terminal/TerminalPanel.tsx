import { useState, useCallback, useRef } from 'react';
import type { Session, Role } from '../../types';
import SessionTab from './SessionTab';
import MessageList from './MessageList';
import InputBar from './InputBar';

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  roles: Role[];
  streamingSessionId: string | null;
  width: number;
  onWidthChange?: (width: number) => void;
  onSwitchSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onCreateSession: (roleId: string) => void;
  onSendMessage: (sessionId: string, content: string, mode: 'talk' | 'do') => void;
  onModeChange: (sessionId: string, mode: 'talk' | 'do') => void;
  onCloseTerminal: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  cto: '#1565C0', cbo: '#E65100', pm: '#2E7D32',
  engineer: '#4A148C', designer: '#AD1457', qa: '#00695C',
};

const MIN_WIDTH = 400;
const MAX_WIDTH = 800;

export default function TerminalPanel({
  sessions, activeSessionId, roles, streamingSessionId, width, onWidthChange,
  onSwitchSession, onCloseSession, onCreateSession, onSendMessage, onModeChange, onCloseTerminal,
}: Props) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const isStreaming = streamingSessionId === activeSessionId;

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const delta = startXRef.current - ev.clientX; // drag left = wider
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      onWidthChange?.(newWidth);
    };

    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width, onWidthChange]);

  return (
    <div
      className="shrink-0 bg-[var(--terminal-bg)] border-l border-[var(--terminal-border)] flex flex-col h-full relative"
      style={{ width }}
    >
      {/* Resize handle — hidden on mobile (full-width overlay) */}
      {onWidthChange && (
        <div
          className={`terminal-resize-handle absolute top-0 left-0 w-1 h-full cursor-col-resize z-10 transition-colors ${isResizing ? 'bg-[var(--terminal-border-hover)]' : 'bg-transparent'}`}
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Tab bar */}
      <div className="flex items-center bg-[var(--terminal-bg-deeper)] border-b border-[var(--terminal-border)] shrink-0">
        <div className="flex-1 flex items-center overflow-x-auto terminal-tab-scroll gap-px px-1 py-1">
          {sessions.map((ses) => (
            <SessionTab
              key={ses.id}
              roleId={ses.roleId}
              title={ses.title}
              roleColor={ROLE_COLORS[ses.roleId] ?? '#666'}
              active={ses.id === activeSessionId}
              onClick={() => onSwitchSession(ses.id)}
              onClose={(e) => { e.stopPropagation(); onCloseSession(ses.id); }}
            />
          ))}
        </div>
        {/* New tab button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-7 h-7 flex items-center justify-center text-[var(--terminal-text-muted)] hover:text-[var(--terminal-text-secondary)] text-lg cursor-pointer"
          >
            +
          </button>
          {showNewMenu && (
            <div className="absolute top-full right-0 mt-1 bg-[var(--terminal-surface)] border border-[var(--terminal-border)] rounded-lg shadow-xl z-50 py-1 min-w-[200px]">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onCreateSession(r.id); setShowNewMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--terminal-text-secondary)] hover:bg-[var(--terminal-surface-light)] cursor-pointer flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: ROLE_COLORS[r.id] ?? '#666' }}
                  />
                  {r.id.toUpperCase()} — {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Close terminal */}
        <button
          onClick={onCloseTerminal}
          className="px-2 py-1 text-[var(--terminal-text-muted)] hover:text-[var(--terminal-text-secondary)] text-sm cursor-pointer shrink-0"
        >
          ×
        </button>
      </div>

      {/* Message area */}
      {activeSession ? (
        <>
          <MessageList
            messages={activeSession.messages}
            roleId={activeSession.roleId}
            roleColor={ROLE_COLORS[activeSession.roleId] ?? '#666'}
          />
          <InputBar
            mode={activeSession.mode}
            onModeChange={(mode) => onModeChange(activeSession.id, mode)}
            onSend={(content) => onSendMessage(activeSession.id, content, activeSession.mode)}
            disabled={isStreaming}
            disabledReason={isStreaming ? `${activeSession.roleId.toUpperCase()} is responding...` : undefined}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--terminal-text-muted)] text-sm">
          No active session. Click [+] to start.
        </div>
      )}
    </div>
  );
}
