import { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { CharacterAppearance } from '../../types/appearance';
import {
  SKIN_PRESETS, HAIR_PRESETS, SHIRT_PRESETS, PANTS_PRESETS, SHOE_PRESETS,
} from '../../types/appearance';
import SpriteCanvas from './SpriteCanvas';

/* ─── Color Swatch ────────────────────────── */

function Swatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="customize-swatch"
      style={{
        background: color,
        outline: selected ? '2px solid #fff' : '2px solid transparent',
        boxShadow: selected ? `0 0 0 1px ${color}, 0 0 6px ${color}88` : 'none',
      }}
    />
  );
}

/* ─── Color Row ───────────────────────────── */

function ColorRow({ label, presets, value, onChange }: {
  label: string;
  presets: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="customize-row">
      <div className="customize-row-header">
        <span className="customize-row-label">{label}</span>
        <div className="customize-row-current" style={{ background: value }} />
      </div>
      <div className="customize-swatches">
        {presets.map(c => (
          <Swatch key={c} color={c} selected={c === value} onClick={() => onChange(c)} />
        ))}
      </div>
    </div>
  );
}

/* ─── Character Editor ────────────────────── */

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAppearance(): CharacterAppearance {
  return {
    skinColor: pick(SKIN_PRESETS),
    hairColor: pick(HAIR_PRESETS),
    shirtColor: pick(SHIRT_PRESETS),
    pantsColor: pick(PANTS_PRESETS),
    shoeColor: pick(SHOE_PRESETS),
  };
}

interface CharacterEditorProps {
  roleId: string;
  appearance: CharacterAppearance;
  onChange: (ap: CharacterAppearance) => void;
  onRandomize: () => void;
  onReset: () => void;
  label?: ReactNode;
}

export default function CharacterEditor({
  roleId, appearance, onChange, onRandomize, onReset, label,
}: CharacterEditorProps) {
  const update = useCallback((key: keyof CharacterAppearance, value: string) => {
    onChange({ ...appearance, [key]: value });
  }, [appearance, onChange]);

  return (
    <>
      {/* Preview */}
      <div className="customize-preview">
        <div className="customize-preview-bg">
          <SpriteCanvas roleId={roleId} appearance={appearance} scale={3} />
        </div>
        {label && <div className="customize-preview-name">{label}</div>}
        <div className="customize-preview-actions">
          <button className="customize-btn customize-btn--random" onClick={onRandomize}>
            RANDOM
          </button>
          <button className="customize-btn customize-btn--reset" onClick={onReset}>
            RESET
          </button>
        </div>
      </div>

      {/* Color Pickers */}
      <div className="customize-colors">
        <ColorRow label="SKIN" presets={SKIN_PRESETS} value={appearance.skinColor} onChange={v => update('skinColor', v)} />
        <ColorRow label="HAIR" presets={HAIR_PRESETS} value={appearance.hairColor} onChange={v => update('hairColor', v)} />
        <ColorRow label="OUTFIT" presets={SHIRT_PRESETS} value={appearance.shirtColor} onChange={v => update('shirtColor', v)} />
        <ColorRow label="PANTS" presets={PANTS_PRESETS} value={appearance.pantsColor} onChange={v => update('pantsColor', v)} />
        <ColorRow label="SHOES" presets={SHOE_PRESETS} value={appearance.shoeColor} onChange={v => update('shoeColor', v)} />
      </div>
    </>
  );
}
