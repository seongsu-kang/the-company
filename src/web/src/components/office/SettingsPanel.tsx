import type { SpeechSettings } from '../../types/speech';

interface Props {
  onClose: () => void;
  speechSettings?: SpeechSettings;
  onSpeechSettingsChange?: (s: Partial<SpeechSettings>) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  onOpenSync?: () => void;
  onOpenGitStatus?: () => void;
  onOpenStats?: () => void;
}

export default function SettingsPanel({
  onClose, speechSettings, onSpeechSettingsChange,
  language, onLanguageChange, onOpenSync, onOpenGitStatus, onOpenStats,
}: Props) {
  return (
    <div className="customize-overlay" onClick={onClose}>
      <div
        className="customize-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        {/* Header */}
        <div className="customize-header">
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'var(--terminal-text)' }}>
            SETTINGS
          </div>
          <button className="customize-close" onClick={onClose}>X</button>
        </div>

        <div className="customize-body" style={{ padding: '12px 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Speech Mode */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--terminal-text)' }}>
                AMBIENT SPEECH MODE
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['template', 'llm', 'auto'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onSpeechSettingsChange?.({ mode: m })}
                    style={{
                      flex: 1, padding: '8px 12px', fontSize: 11,
                      border: `2px solid ${speechSettings?.mode === m ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                      background: speechSettings?.mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: speechSettings?.mode === m ? 'var(--terminal-text)' : 'var(--terminal-text-muted)',
                      borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {m === 'template' ? 'TEMPLATE' : m === 'llm' ? 'AI' : 'AUTO'}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>
                      {m === 'template' ? 'Static pool ($0)' : m === 'llm' ? 'LLM generated' : 'Detect engine'}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 9, color: 'var(--terminal-text-muted)', marginTop: 4 }}>
                Auto: CLI Max = AI, BYOK = Template
              </div>
            </div>

            {/* Speech Interval */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--terminal-text)' }}>
                SPEECH INTERVAL: {speechSettings?.intervalSec ?? 18}s
              </div>
              <input type="range" min={5} max={120} step={5}
                value={speechSettings?.intervalSec ?? 18}
                onChange={e => onSpeechSettingsChange?.({ intervalSec: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--terminal-text-muted)' }}>
                <span>5s (frequent)</span><span>120s (rare)</span>
              </div>
            </div>

            {/* Daily Budget */}
            {speechSettings?.mode !== 'template' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--terminal-text)' }}>
                  DAILY LLM BUDGET: ${speechSettings?.dailyBudgetUsd?.toFixed(2) ?? '1.00'}
                </div>
                <input type="range" min={0} max={5} step={0.25}
                  value={speechSettings?.dailyBudgetUsd ?? 1.0}
                  onChange={e => onSpeechSettingsChange?.({ dailyBudgetUsd: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--terminal-text-muted)' }}>
                  <span>$0 (unlimited)</span><span>$5.00/day</span>
                </div>
              </div>
            )}

            {/* Language */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--terminal-text)' }}>
                LANGUAGE
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { key: 'auto', label: 'Auto' },
                  { key: 'en', label: 'English' },
                  { key: 'ko', label: '한국어' },
                  { key: 'ja', label: '日本語' },
                ] as const).map(({ key, label }) => (
                  <button key={key}
                    onClick={() => onLanguageChange?.(key)}
                    style={{
                      flex: 1, padding: '8px 12px', fontSize: 11,
                      border: `2px solid ${(language ?? 'auto') === key ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                      background: (language ?? 'auto') === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: (language ?? 'auto') === key ? 'var(--terminal-text)' : 'var(--terminal-text-muted)',
                      borderRadius: 6, cursor: 'pointer', textAlign: 'center', fontWeight: 600,
                    }}
                  >{label}</button>
                ))}
              </div>
              <div style={{ fontSize: 9, color: 'var(--terminal-text-muted)', marginTop: 4 }}>
                Sets language for AI responses and speech bubbles
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', gap: 8 }}>
              {onOpenSync && (
                <button onClick={() => { onClose(); onOpenSync(); }}
                  className="theme-btn" style={{ flex: 1, padding: '8px 12px', fontSize: 10 }}>
                  🔄 ROLE SYNC
                </button>
              )}
              {onOpenGitStatus && (
                <button onClick={() => { onClose(); onOpenGitStatus(); }}
                  className="theme-btn" style={{ flex: 1, padding: '8px 12px', fontSize: 10 }}>
                  📂 GIT STATUS
                </button>
              )}
              {onOpenStats && (
                <button onClick={() => { onClose(); onOpenStats(); }}
                  className="theme-btn" style={{ flex: 1, padding: '8px 12px', fontSize: 10 }}>
                  📊 COMPANY STATS
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
