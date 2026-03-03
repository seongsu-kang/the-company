import { useState, useRef, useEffect } from 'react';
import type { CreateRoleInput } from '../../types';

interface Props {
  existingRoles: { id: string; name: string }[];
  onClose: () => void;
  onHire: (input: CreateRoleInput) => Promise<void>;
}

const LEVEL_OPTIONS: { value: CreateRoleInput['level']; label: string }[] = [
  { value: 'c-level', label: 'C-Level' },
  { value: 'team-lead', label: 'Team Lead' },
  { value: 'member', label: 'Member' },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
}

function defaultsForLevel(level: CreateRoleInput['level']) {
  switch (level) {
    case 'c-level':
      return {
        authority: { autonomous: ['Strategic decisions within domain', 'Task delegation to reports'], needsApproval: ['Budget over $5K', 'External commitments'] },
        knowledge: { reads: ['company/', 'operations/', 'projects/'], writes: ['operations/', 'knowledge/'] },
        reports: { daily: 'standup', weekly: 'summary' },
      };
    case 'team-lead':
      return {
        authority: { autonomous: ['Task planning', 'Sprint management'], needsApproval: ['Architecture changes', 'New tool adoption'] },
        knowledge: { reads: ['projects/', 'architecture/'], writes: ['projects/'] },
        reports: { daily: 'standup', weekly: 'summary' },
      };
    default:
      return {
        authority: { autonomous: ['Implementation within assigned tasks'], needsApproval: ['Design changes', 'New dependencies'] },
        knowledge: { reads: ['projects/'], writes: [] as string[] },
        reports: { daily: 'standup', weekly: '' },
      };
  }
}

export default function HireRoleModal({ existingRoles, onClose, onHire }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [idEdited, setIdEdited] = useState(false);
  const [level, setLevel] = useState<CreateRoleInput['level']>('member');
  const [reportsTo, setReportsTo] = useState('ceo');
  const [persona, setPersona] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const personaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 1) nameRef.current?.focus();
    if (step === 2) personaRef.current?.focus();
  }, [step]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!idEdited) setId(slugify(v));
  };

  const canNext1 = name.trim().length > 0 && id.trim().length > 0 && !existingRoles.some((r) => r.id === id);
  const canNext2 = persona.trim().length > 0;

  const handleHire = async () => {
    setBusy(true);
    setError('');
    const defaults = defaultsForLevel(level);
    try {
      await onHire({
        id,
        name: name.trim(),
        level,
        reportsTo,
        persona: persona.trim(),
        ...defaults,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (step === 1 && canNext1) setStep(2);
      else if (step === 2 && canNext2) setStep(3);
      else if (step === 3) handleHire();
    }
  };

  const idConflict = existingRoles.some((r) => r.id === id) && id.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] z-[61] bg-[var(--wall)] rounded-2xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #2E7D32, #43A047)' }}>
          <div className="text-lg font-bold">Hire New Role</div>
          <div className="text-sm opacity-80 mt-0.5">Step {step} of 3</div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ background: s <= step ? '#2E7D32' : '#E0E0E0' }}
            />
          ))}
        </div>

        {/* Body */}
        <div className="p-5 min-h-[240px]">
          {step === 1 && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-1">Role Name</label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Data Analyst"
                  className="w-full p-2.5 rounded-lg border-2 border-[var(--office-border)] bg-white text-sm focus:outline-none focus:border-[var(--desk-dark)] transition-colors"
                />
              </div>
              {/* ID */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-1">Role ID (slug)</label>
                <input
                  value={id}
                  onChange={(e) => { setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setIdEdited(true); }}
                  className={`w-full p-2.5 rounded-lg border-2 bg-white text-sm font-mono focus:outline-none transition-colors ${idConflict ? 'border-red-400' : 'border-[var(--office-border)] focus:border-[var(--desk-dark)]'}`}
                />
                {idConflict && <div className="text-xs text-red-500 mt-1">ID already exists</div>}
              </div>
              {/* Level */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-1">Level</label>
                <div className="flex gap-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLevel(opt.value)}
                      className={`flex-1 p-2 text-xs font-semibold rounded-lg border-2 cursor-pointer transition-colors ${level === opt.value ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Reports To */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-1">Reports To</label>
                <select
                  value={reportsTo}
                  onChange={(e) => setReportsTo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border-2 border-[var(--office-border)] bg-white text-sm focus:outline-none focus:border-[var(--desk-dark)] transition-colors"
                >
                  <option value="ceo">CEO</option>
                  {existingRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Persona</label>
              <textarea
                ref={personaRef}
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Describe this role's personality, expertise, and working style..."
                className="w-full h-40 p-3 rounded-lg border-2 border-[var(--office-border)] bg-white text-sm resize-none focus:outline-none focus:border-[var(--desk-dark)] transition-colors"
              />
              <div className="text-[10px] text-gray-400 mt-1">This defines how the AI agent will behave in this role</div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-[var(--desk-dark)] uppercase tracking-wider mb-2">Review</div>
              <div className="bg-white rounded-xl p-4 border border-[var(--office-border)] space-y-2.5">
                <ReviewRow label="Name" value={name} />
                <ReviewRow label="ID" value={id} mono />
                <ReviewRow label="Level" value={level} />
                <ReviewRow label="Reports To" value={reportsTo} />
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Persona</div>
                  <div className="text-xs text-gray-700 leading-relaxed">{persona}</div>
                </div>
              </div>
              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{error}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-5 pb-5">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canNext1 : !canNext2}
                className="px-5 py-2 text-sm text-white rounded-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#2E7D32' }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleHire}
                disabled={busy}
                className="px-5 py-2 text-sm text-white rounded-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#2E7D32' }}
              >
                {busy ? 'Hiring...' : 'HIRE'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
