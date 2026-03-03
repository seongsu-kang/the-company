import { useState, useRef, useEffect } from 'react';

interface Props {
  onClose: () => void;
  onDispatch: (directive: string) => void;
}

export default function WaveModal({ onClose, onDispatch }: Props) {
  const [directive, setDirective] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!directive.trim()) return;
    onDispatch(directive.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] z-[61] bg-[var(--wall)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #B71C1C, #D32F2F)' }}>
          <div className="text-lg font-bold">CEO Wave</div>
          <div className="text-sm opacity-80 mt-0.5">Dispatch a directive to all roles</div>
        </div>

        {/* Body */}
        <div className="p-5">
          <label className="block text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">
            Directive
          </label>
          <textarea
            ref={inputRef}
            value={directive}
            onChange={(e) => setDirective(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a company-wide directive..."
            className="w-full h-32 p-3 rounded-lg border-2 border-[var(--office-border)] bg-white text-sm resize-none focus:outline-none focus:border-[var(--desk-dark)] transition-colors"
          />
          <div className="text-[10px] text-gray-400 mt-1">Cmd+Enter to dispatch</div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!directive.trim()}
            className="px-5 py-2 text-sm text-white rounded-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#B71C1C' }}
          >
            Dispatch Wave
          </button>
        </div>
      </div>
    </>
  );
}
