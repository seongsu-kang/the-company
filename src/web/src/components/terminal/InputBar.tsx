import { useState, useRef, useEffect } from 'react';

interface Props {
  mode: 'talk' | 'do';
  onModeChange: (mode: 'talk' | 'do') => void;
  onSend: (content: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function InputBar({ mode, onModeChange, onSend, disabled, disabledReason }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--terminal-border)] p-3 shrink-0">
      {disabledReason && (
        <div className="text-[10px] text-amber-400/70 mb-2 text-center">{disabledReason}</div>
      )}
      <div className="flex items-end gap-2">
        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--terminal-border)] shrink-0">
          <button
            onClick={() => onModeChange('talk')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
              mode === 'talk'
                ? 'bg-[var(--desk-wood)] text-white'
                : 'bg-[var(--terminal-inline-bg)] text-[var(--terminal-text-secondary)] hover:text-[var(--terminal-text)]'
            }`}
          >
            Talk
          </button>
          <button
            onClick={() => onModeChange('do')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
              mode === 'do'
                ? 'bg-amber-700 text-white'
                : 'bg-[var(--terminal-inline-bg)] text-[var(--terminal-text-secondary)] hover:text-[var(--terminal-text)]'
            }`}
          >
            Do
          </button>
        </div>

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Waiting...' : mode === 'talk' ? 'Ask something...' : 'Give a directive...'}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-[var(--terminal-inline-bg)] border border-[var(--terminal-border)] rounded-lg px-3 py-2 text-sm text-[var(--terminal-text)] placeholder:text-[var(--terminal-text-muted)] resize-none focus:outline-none focus:border-[var(--terminal-border-hover)] disabled:opacity-40 terminal-scrollbar"
        />

        {/* Send */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="w-8 h-8 rounded-lg bg-[var(--terminal-surface-light)] text-[var(--terminal-text-secondary)] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[var(--desk-wood)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
