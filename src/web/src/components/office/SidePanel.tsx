import { useState, useCallback, useRef } from 'react';
import type { RoleDetail } from '../../types';
import OfficeMarkdown from './OfficeMarkdown';

interface Props {
  role: RoleDetail | null;
  allRoles: { id: string; name: string; level: string; reportsTo: string }[];
  recentActivity: string;
  onClose: () => void;
  onAssignTask?: (roleId: string, roleName: string) => void;
  onAskRole?: (roleId: string, roleName: string) => void;
  onOpenTerminal?: (roleId: string) => void;
  onFireRole?: (roleId: string, roleName: string) => void;
  terminalWidth?: number;
}

const ROLE_ICONS: Record<string, string> = {
  cto: '\u{1F3D7}\u{FE0F}', cbo: '\u{1F4CA}', pm: '\u{1F4CB}',
  engineer: '\u{2699}\u{FE0F}', designer: '\u{1F3A8}', qa: '\u{1F50D}',
};

const ROLE_COLORS: Record<string, string> = {
  cto: '#1565C0', cbo: '#E65100', pm: '#2E7D32',
  engineer: '#4A148C', designer: '#AD1457', qa: '#00695C',
};

const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 360;
const MAX_WIDTH = 700;

export default function SidePanel({ role, allRoles, recentActivity, onClose, onAssignTask, onAskRole, onOpenTerminal, onFireRole, terminalWidth = 0 }: Props) {
  const [showJournal, setShowJournal] = useState(false);
  const [panelW, setPanelW] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const hasTerminal = terminalWidth > 0;
  const panelRight = hasTerminal ? terminalWidth : 0;
  // Clamp width to available space when terminal is open
  const maxAvailable = hasTerminal ? Math.max(MIN_WIDTH, window.innerWidth - terminalWidth - 100) : MAX_WIDTH;
  const panelWidth = Math.min(panelW, maxAvailable);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const delta = startXRef.current - ev.clientX; // drag left = wider
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

  return (
    <>
      {/* Dimmer — Terminal 열림 시 Terminal 영역 제외 */}
      <div className="dimmer fixed top-0 left-0 bottom-0 bg-black/30 z-40 open" style={{ right: panelRight }} onClick={onClose} />

      {/* Panel — Terminal 열림 시 왼쪽으로 offset */}
      <div className={`side-panel open fixed top-0 h-full z-50 flex flex-col bg-[var(--wall)] border-l-[3px] shadow-[-4px_0_20px_rgba(0,0,0,0.2)] ${isResizing ? 'resizing' : ''}`}
        style={{ borderLeftColor: color, right: panelRight, width: panelWidth }}
      >
        {/* Resize handle */}
        <div
          className={`absolute top-0 -left-[5px] w-[10px] h-full cursor-col-resize z-[60] transition-colors ${isResizing ? 'bg-black/10' : 'hover:bg-black/5'}`}
          onMouseDown={handleResizeStart}
        />

        {/* Header */}
        <div className="p-6 text-white relative" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-lg hover:bg-white/30 cursor-pointer"
          >
            ×
          </button>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mb-3">
            {icon}
          </div>
          <div className="text-xl font-bold">{role.id.toUpperCase()}</div>
          <div className="text-sm opacity-80 mt-1">{role.name} · {role.level}</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Speech Bubble */}
          <div className="mb-6">
            <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Latest</div>
            <div className="bg-white rounded-xl p-4 border border-[var(--office-border)] relative text-sm text-[#555] leading-relaxed">
              <span className="absolute -top-2 left-3 text-3xl text-[var(--desk-wood)] font-serif">"</span>
              <p className="mt-2">{recentActivity || 'No recent activity.'}</p>
            </div>
          </div>

          {/* Persona */}
          {role.persona && (
            <div className="mb-6">
              <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Persona</div>
              <div className="text-xs text-gray-600 leading-relaxed bg-white/50 rounded-lg p-3 border border-[var(--office-border)]">
                {role.persona}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mb-6">
            <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Info</div>
            <div className="space-y-0">
              <InfoRow label="Level" value={role.level} />
              <InfoRow label="Reports to" value={role.reportsTo} />
              <InfoRow label="Status" value={role.status} />
            </div>
          </div>

          {/* Direct Reports */}
          {reports.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Direct Reports</div>
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: ROLE_COLORS[r.id] ?? '#666' }}
                    >
                      {r.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-[11px] text-gray-400">{r.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authority */}
          {role.authority && (
            <div className="mb-6">
              <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Authority</div>
              {role.authority.autonomous?.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-green-700 font-semibold mb-1">Autonomous</div>
                  {role.authority.autonomous.map((a, i) => (
                    <div key={i} className="text-xs text-gray-600 pl-3 py-0.5">• {a}</div>
                  ))}
                </div>
              )}
              {role.authority.needsApproval?.length > 0 && (
                <div>
                  <div className="text-xs text-amber-700 font-semibold mb-1">Needs Approval</div>
                  {role.authority.needsApproval.map((a, i) => (
                    <div key={i} className="text-xs text-gray-600 pl-3 py-0.5">• {a}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Journal */}
          {role.journal && (
            <div className="mb-6">
              <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Today's Journal</div>
              {showJournal ? (
                <div className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-3 border border-[var(--office-border)] max-h-[300px] overflow-y-auto">
                  <OfficeMarkdown content={role.journal.slice(0, 3000)} />
                  {role.journal.length > 3000 && <div className="text-gray-400 italic mt-2">... (truncated)</div>}
                </div>
              ) : (
                <button
                  onClick={() => setShowJournal(true)}
                  className="w-full p-2.5 text-left text-sm font-medium border border-[var(--desk-wood)] rounded-lg bg-white hover:bg-[var(--desk-wood)] hover:text-white transition-colors cursor-pointer"
                >
                  Show Journal ({(role.journal.match(/### /g) ?? []).length} entries)
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div>
            <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Actions</div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => onAssignTask?.(role.id, role.name)}
                className="flex-1 p-2.5 text-center text-sm font-semibold rounded-lg text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: color }}
              >
                Assign Task
              </button>
              <button
                onClick={() => onAskRole?.(role.id, role.name)}
                className="flex-1 p-2.5 text-center text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2"
                style={{ borderColor: color, color }}
              >
                Ask
              </button>
            </div>
            <button
              onClick={() => { onOpenTerminal?.(role.id); onClose(); }}
              className="w-full p-2.5 text-center text-sm font-medium border-2 border-dashed rounded-lg cursor-pointer hover:bg-white/80 transition-colors"
              style={{ borderColor: color, color }}
            >
              Chat
            </button>
            {onFireRole && (
              <button
                onClick={() => { onFireRole(role.id, role.name); onClose(); }}
                className="w-full mt-3 p-2.5 text-center text-xs font-medium border-2 border-dashed border-red-300 text-red-400 rounded-lg cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-400 transition-colors"
              >
                Fire Role
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[var(--office-border)] text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
