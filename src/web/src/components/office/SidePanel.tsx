import { useState, useEffect, useCallback, useRef } from 'react';
import type { RoleDetail, Session } from '../../types';
import useActivityStream from '../../hooks/useActivityStream';
import OfficeMarkdown from './OfficeMarkdown';

interface Props {
  role: RoleDetail | null;
  allRoles: { id: string; name: string; level: string; reportsTo: string }[];
  recentActivity: string;
  onClose: () => void;
  onFireRole?: (roleId: string, roleName: string) => void;
  terminalWidth?: number;
  // Live activity
  activeJobId?: string;
  activeTask?: string;
  isWorking?: boolean;
  jobStartedAt?: string;
  onStopJob?: (jobId: string) => void;
  // Inline chat
  sessions: Session[];
  streamingSessionId: string | null;
  onCreateSessionSilent: (roleId: string) => void;
  onSendMessage: (sessionId: string, content: string, mode: 'talk' | 'do') => void;
  onFocusTerminal: (roleId: string) => void;
}

const ROLE_ICONS: Record<string, string> = {
  cto: '\u{1F3D7}\u{FE0F}', cbo: '\u{1F4CA}', pm: '\u{1F4CB}',
  engineer: '\u{2699}\u{FE0F}', designer: '\u{1F3A8}', qa: '\u{1F50D}',
};

const ROLE_COLORS: Record<string, string> = {
  cto: '#1565C0', cbo: '#E65100', pm: '#2E7D32',
  engineer: '#4A148C', designer: '#AD1457', qa: '#00695C',
};

const ROLE_NAMES: Record<string, string> = {
  cto: 'Chief Technology Officer',
  cbo: 'Chief Business Officer',
  pm: 'Product Manager',
  engineer: 'Software Engineer',
  designer: 'UI/UX Designer',
  qa: 'QA Engineer',
};

const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 360;
const MAX_WIDTH = 700;

const fmtElapsed = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function SidePanel({
  role, allRoles, recentActivity, onClose, onFireRole, terminalWidth = 0,
  activeJobId, activeTask, isWorking, jobStartedAt, onStopJob,
  sessions, streamingSessionId, onCreateSessionSilent, onSendMessage, onFocusTerminal,
}: Props) {
  const [panelW, setPanelW] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Collapsible sections
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthority, setShowAuthority] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  // Idle mode input
  const [idleMode, setIdleMode] = useState<'talk' | 'do'>('talk');

  // Activity stream for working state (compact summary)
  const { events: activityEvents, status: activityStatus } = useActivityStream(activeJobId ?? null);

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isWorking || !jobStartedAt) { setElapsed(0); return; }
    const start = new Date(jobStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isWorking, jobStartedAt]);

  const hasTerminal = terminalWidth > 0;
  const panelRight = hasTerminal ? terminalWidth : 0;
  const maxAvailable = hasTerminal ? Math.max(MIN_WIDTH, window.innerWidth - terminalWidth - 100) : MAX_WIDTH;
  const panelWidth = Math.min(panelW, maxAvailable);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const delta = startXRef.current - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setPanelW(newWidth);
    };

    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  // Track pending message to send after session creation
  const pendingMessageRef = useRef<{ content: string; mode: 'talk' | 'do' } | null>(null);
  const roleSession = role ? sessions.find(s => s.roleId === role.id) : null;

  const handleInlineSend = (content: string) => {
    if (!role) return;
    const mode = isWorking ? 'talk' : idleMode;

    if (roleSession) {
      onSendMessage(roleSession.id, content, mode);
      // Focus terminal to show full conversation
      onFocusTerminal(role.id);
    } else {
      pendingMessageRef.current = { content, mode };
      onCreateSessionSilent(role.id);
    }
  };

  // Send pending message when session becomes available, then focus terminal
  useEffect(() => {
    if (roleSession && pendingMessageRef.current) {
      const { content, mode } = pendingMessageRef.current;
      pendingMessageRef.current = null;
      onSendMessage(roleSession.id, content, mode);
      if (role) onFocusTerminal(role.id);
    }
  }, [roleSession?.id]);

  // Compact activity summary: count event types
  const activitySummary = (() => {
    if (!activityEvents.length) return null;
    const tools: string[] = [];
    let thinkCount = 0;
    let textCount = 0;
    let dispatchCount = 0;
    for (const ev of activityEvents) {
      if (ev.type === 'thinking') thinkCount++;
      else if (ev.type === 'text') textCount++;
      else if (ev.type === 'tool:start') {
        const name = String(ev.data.name ?? '');
        if (!tools.includes(name)) tools.push(name);
      }
      else if (ev.type === 'dispatch:start') dispatchCount++;
    }
    return { tools, thinkCount, textCount, dispatchCount, total: activityEvents.length };
  })();

  // Derive task description: from job or from last CEO message in session
  const effectiveTask = activeTask || (() => {
    if (!roleSession) return null;
    const msgs = roleSession.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].from === 'ceo') return msgs[i].content;
    }
    return null;
  })();

  // Last text message from the current session (for preview)
  const lastRoleMessage = (() => {
    if (!roleSession) return null;
    const msgs = roleSession.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].from === 'role' && msgs[i].content) return msgs[i].content;
    }
    return null;
  })();

  if (!role) {
    return (
      <>
        <div className="dimmer fixed top-0 left-0 bottom-0 bg-black/30 z-40 open" style={{ right: panelRight }} onClick={onClose} />
        <div className="side-panel open fixed top-0 h-full z-50 flex items-center justify-center bg-[var(--wall)] border-l-[3px] border-gray-400"
          style={{ right: panelRight, width: panelWidth }}
        >
          <div className="text-gray-400 text-sm">Loading role...</div>
        </div>
      </>
    );
  }

  const color = ROLE_COLORS[role.id] ?? '#666';
  const icon = ROLE_ICONS[role.id] ?? '\u{1F464}';
  const reports = allRoles.filter((r) => r.reportsTo === role.id);
  const isStreaming = roleSession && streamingSessionId === roleSession.id;
  const roleName = ROLE_NAMES[role.id] ?? role.name;

  return (
    <>
      <div className="dimmer fixed top-0 left-0 bottom-0 bg-black/30 z-40 open" style={{ right: panelRight }} onClick={onClose} />

      <div className={`side-panel open fixed top-0 h-full z-50 flex flex-col bg-[var(--wall)] border-l-[3px] shadow-[-4px_0_20px_rgba(0,0,0,0.2)] ${isResizing ? 'resizing' : ''}`}
        style={{ borderLeftColor: color, right: panelRight, width: panelWidth }}
      >
        {/* Resize handle */}
        <div
          className={`absolute top-0 -left-[5px] w-[10px] h-full cursor-col-resize z-[60] transition-colors ${isResizing ? 'bg-black/10' : 'hover:bg-black/5'}`}
          onMouseDown={handleResizeStart}
        />

        {/* Header */}
        <div className="p-4 text-white relative shrink-0" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-lg hover:bg-white/30 cursor-pointer"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <div className="text-lg font-bold flex items-center gap-2">
                {role.id.toUpperCase()}
                {isWorking && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 animate-pulse">
                    Working
                  </span>
                )}
              </div>
              <div className="text-sm opacity-80">{role.name} · {role.level}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* ─── STATUS (working) ─── */}
          {isWorking && (
            <div className="px-4 py-3 border-b border-[var(--office-border)] bg-amber-50/50 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-800">
                    Working{elapsed > 0 ? ` · ${fmtElapsed(elapsed)}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onFocusTerminal(role.id)}
                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Open chat ↗
                  </button>
                  {activeJobId && onStopJob && (
                    <button
                      onClick={() => onStopJob(activeJobId)}
                      className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer font-semibold transition-colors"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
              {effectiveTask && (
                <div className="text-xs text-amber-700 truncate">{effectiveTask}</div>
              )}
            </div>
          )}

          {/* ─── ACTIVITY COMPACT (working) ─── */}
          {isWorking && activeJobId && activitySummary && (
            <div className="px-4 py-2.5 border-b border-[var(--office-border)] shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider">Activity</div>
                <button
                  onClick={() => onFocusTerminal(role.id)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  View details ↗
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activitySummary.thinkCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    thinking ×{activitySummary.thinkCount}
                  </span>
                )}
                {activitySummary.tools.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-600">
                    {t}
                  </span>
                ))}
                {activitySummary.dispatchCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-600">
                    dispatch ×{activitySummary.dispatchCount}
                  </span>
                )}
                {activitySummary.textCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-600">
                    output ×{activitySummary.textCount}
                  </span>
                )}
                {(activityStatus === 'streaming' || activityStatus === 'connecting') && (
                  <span className="inline-block w-1.5 h-3 bg-green-400 animate-pulse rounded-sm" />
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{activitySummary.total} events</div>
            </div>
          )}

          {/* ─── LAST MESSAGE PREVIEW (working, has session) ─── */}
          {isWorking && lastRoleMessage && (
            <div className="px-4 py-2.5 border-b border-[var(--office-border)] shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider">Last Message</div>
                <button
                  onClick={() => onFocusTerminal(role.id)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Open chat ↗
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 text-xs text-gray-600 leading-relaxed line-clamp-3 overflow-hidden">
                {lastRoleMessage.slice(0, 200)}
                {lastRoleMessage.length > 200 && '...'}
              </div>
            </div>
          )}

          {/* ─── QUICK INPUT (working) ─── */}
          {isWorking && (
            <div className="px-4 py-2.5 border-b border-[var(--office-border)] shrink-0">
              <MiniInputBar
                onSend={handleInlineSend}
                disabled={!!isStreaming}
                placeholder="Ask something..."
                color={color}
              />
            </div>
          )}

          {/* ─── SPEECH BUBBLE (idle) ─── */}
          {!isWorking && (
            <div className="px-4 pt-4 pb-2">
              <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Latest</div>
              <SpeechBubble
                icon={icon}
                roleId={role.id}
                roleName={roleName}
                color={color}
                text={recentActivity}
              />
            </div>
          )}

          {/* ─── INLINE INPUT (idle) ─── */}
          {!isWorking && (
            <div className="px-4 py-3 border-b border-[var(--office-border)]">
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {/* Last message preview (idle, has prior conversation) */}
                {lastRoleMessage && (
                  <div
                    className="px-3 pt-2.5 pb-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onFocusTerminal(role.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last response</span>
                      <span className="text-[10px] text-gray-400">View ↗</span>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed line-clamp-2 overflow-hidden">
                      {lastRoleMessage.slice(0, 150)}
                      {lastRoleMessage.length > 150 && '...'}
                    </div>
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 shrink-0">
                      <button
                        onClick={() => setIdleMode('talk')}
                        className={`px-2 py-1 text-[10px] font-semibold cursor-pointer transition-colors ${
                          idleMode === 'talk'
                            ? 'bg-[var(--desk-wood)] text-white'
                            : 'bg-white text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Talk
                      </button>
                      <button
                        onClick={() => setIdleMode('do')}
                        className={`px-2 py-1 text-[10px] font-semibold cursor-pointer transition-colors ${
                          idleMode === 'do'
                            ? 'bg-amber-700 text-white'
                            : 'bg-white text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Do
                      </button>
                    </div>
                    <MiniInputBar
                      onSend={handleInlineSend}
                      disabled={!!isStreaming}
                      placeholder={idleMode === 'talk' ? 'Ask something...' : 'Give a directive...'}
                      color={color}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── COLLAPSIBLE SECTIONS ─── */}
          <div className="px-4 py-2 space-y-1">
            {/* Profile */}
            <CollapsibleSection title={`Profile${role.persona ? '' : ' (empty)'}`} open={showProfile} onToggle={() => setShowProfile(v => !v)}>
              {role.persona && (
                <div className="text-xs text-gray-600 leading-relaxed bg-white/50 rounded-lg p-3 border border-[var(--office-border)]">
                  {role.persona}
                </div>
              )}
              <div className="space-y-0 mt-2">
                <InfoRow label="Level" value={role.level} />
                <InfoRow label="Reports to" value={role.reportsTo} />
                <InfoRow label="Status" value={role.status} />
              </div>
              {reports.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] text-gray-500 font-semibold mb-1">Direct Reports</div>
                  <div className="space-y-1">
                    {reports.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: ROLE_COLORS[r.id] ?? '#666' }}
                        >
                          {r.id.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-xs">{r.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Authority */}
            {role.authority && (
              <CollapsibleSection title="Authority" open={showAuthority} onToggle={() => setShowAuthority(v => !v)}>
                {role.authority.autonomous?.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-green-700 font-semibold mb-1">Autonomous</div>
                    {role.authority.autonomous.map((a, i) => (
                      <div key={i} className="text-xs text-gray-600 pl-3 py-0.5">- {a}</div>
                    ))}
                  </div>
                )}
                {role.authority.needsApproval?.length > 0 && (
                  <div>
                    <div className="text-xs text-amber-700 font-semibold mb-1">Needs Approval</div>
                    {role.authority.needsApproval.map((a, i) => (
                      <div key={i} className="text-xs text-gray-600 pl-3 py-0.5">- {a}</div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Journal */}
            {role.journal && (
              <CollapsibleSection
                title={`Journal (${(role.journal.match(/### /g) ?? []).length})`}
                open={showJournal}
                onToggle={() => setShowJournal(v => !v)}
              >
                <div className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-3 border border-[var(--office-border)] max-h-[300px] overflow-y-auto">
                  <OfficeMarkdown content={role.journal.slice(0, 3000)} />
                  {role.journal.length > 3000 && <div className="text-gray-400 italic mt-2">... (truncated)</div>}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* ─── FIRE (always at bottom) ─── */}
          {onFireRole && (
            <div className="px-4 pb-4 mt-auto shrink-0">
              <button
                onClick={() => { onFireRole(role.id, role.name); onClose(); }}
                className="w-full p-2 text-center text-xs font-medium border-2 border-dashed border-red-300 text-red-400 rounded-lg cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-400 transition-colors"
              >
                Fire Role
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Speech Bubble (enhanced) ─────────────────── */

function SpeechBubble({ icon, roleId, roleName, color, text }: {
  icon: string;
  roleId: string;
  roleName: string;
  color: string;
  text: string;
}) {
  const hasText = !!text;

  return (
    <div className="relative">
      {/* Character row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
            style={{ background: `${color}18`, border: `2px solid ${color}44` }}
          >
            {icon}
          </div>
          <div
            className="text-[9px] font-bold text-center mt-0.5 uppercase tracking-wide"
            style={{ color }}
          >
            {roleId}
          </div>
        </div>

        {/* Bubble */}
        <div className="flex-1 min-w-0">
          {/* Tail triangle */}
          <div className="relative">
            <div
              className="absolute top-3 -left-2 w-0 h-0"
              style={{
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: `8px solid ${color}12`,
              }}
            />
            <div
              className="rounded-xl rounded-tl-sm p-4 border"
              style={{ background: `${color}08`, borderColor: `${color}22` }}
            >
              <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color }}>
                {roleName}
              </div>
              {hasText ? (
                <div className="text-sm text-[#444] leading-relaxed">
                  <OfficeMarkdown content={text} />
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Collapsible Section ─────────────────── */

function CollapsibleSection({ title, open, onToggle, children }: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--office-border)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between bg-white/50 hover:bg-white/80 cursor-pointer transition-colors"
      >
        <span className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider">{title}</span>
        <span className="text-xs text-gray-400">{open ? '\u25BC' : '\u25B6'}</span>
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

/* ─── Mini Input Bar ─────────────────── */

function MiniInputBar({ onSend, disabled, placeholder, color }: {
  onSend: (content: string) => void;
  disabled: boolean;
  placeholder: string;
  color: string;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="flex items-center gap-1.5 flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
        placeholder={disabled ? 'Waiting...' : placeholder}
        disabled={disabled}
        className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 disabled:opacity-40"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        style={{ background: disabled || !value.trim() ? '#666' : color }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Info Row ─────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--office-border)] text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
