import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CharacterAppearance } from '../../types/appearance';
import {
  SKIN_PRESETS, HAIR_PRESETS, SHIRT_PRESETS, PANTS_PRESETS, SHOE_PRESETS,
} from '../../types/appearance';
import { getAllHairStyles, extractAppearance } from './sprites/engine';
import './sprites/engine/hairstyles'; // ensure registration
import TopDownCharCanvas from './TopDownCharCanvas';

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

/* ─── Hair Style Row ─────────────────────── */

function HairStyleRow({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const styles = getAllHairStyles();
  return (
    <div className="customize-row">
      <div className="customize-row-header">
        <span className="customize-row-label">STYLE</span>
      </div>
      <div className="customize-swatches" style={{ gap: 4 }}>
        {styles.map(s => (
          <button
            key={s.id}
            onClick={() => onChange(s.id === value ? undefined : s.id)}
            className="customize-swatch"
            style={{
              width: 'auto',
              height: 'auto',
              padding: '2px 6px',
              fontSize: 9,
              fontFamily: 'var(--font-pixel, monospace)',
              background: s.id === value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
              outline: s.id === value ? '2px solid #fff' : '2px solid transparent',
              color: s.id === value ? '#fff' : 'rgba(255,255,255,0.5)',
              borderRadius: 4,
            }}
          >
            {s.name}
          </button>
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
  const update = useCallback((key: keyof CharacterAppearance, value: string | undefined) => {
    onChange({ ...appearance, [key]: value });
  }, [appearance, onChange]);

  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const extracted = extractAppearance(img);
      onChange({ ...extracted, hairStyle: appearance.hairStyle });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  }, [appearance.hairStyle, onChange]);

  return (
    <>
      {/* Preview */}
      <div className="customize-preview">
        <div className="customize-preview-bg">
          <TopDownCharCanvas roleId={roleId} appearance={appearance} scale={12} />
        </div>
        {label && <div className="customize-preview-name">{label}</div>}
        <div className="customize-preview-actions">
          <button className="customize-btn customize-btn--random" onClick={onRandomize}>
            RANDOM
          </button>
          <button className="customize-btn customize-btn--reset" onClick={onReset}>
            RESET
          </button>
          <button
            className="customize-btn"
            onClick={() => fileRef.current?.click()}
            style={{ fontSize: 9, opacity: 0.7 }}
          >
            PHOTO
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Color Pickers */}
      <div className="customize-colors">
        <ColorRow label="SKIN" presets={SKIN_PRESETS} value={appearance.skinColor} onChange={v => update('skinColor', v)} />
        <ColorRow label="HAIR" presets={HAIR_PRESETS} value={appearance.hairColor} onChange={v => update('hairColor', v)} />
        <HairStyleRow value={appearance.hairStyle} onChange={v => onChange({ ...appearance, hairStyle: v })} />
        <ColorRow label="OUTFIT" presets={SHIRT_PRESETS} value={appearance.shirtColor} onChange={v => update('shirtColor', v)} />
        <ColorRow label="PANTS" presets={PANTS_PRESETS} value={appearance.pantsColor} onChange={v => update('pantsColor', v)} />
        <ColorRow label="SHOES" presets={SHOE_PRESETS} value={appearance.shoeColor} onChange={v => update('shoeColor', v)} />
      </div>
    </>
  );
}
