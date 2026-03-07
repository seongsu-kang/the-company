import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CharacterAppearance } from '../../types/appearance';
import {
  SKIN_PRESETS, HAIR_PRESETS, SHIRT_PRESETS, PANTS_PRESETS, SHOE_PRESETS,
} from '../../types/appearance';
import { getAllHairStyles, getAllOutfitStyles, getAllAccessories, extractAppearance } from './sprites/engine';
import './sprites/engine/hairstyles'; // ensure registration
import './sprites/engine/outfits';
import './sprites/engine/accessories';
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

/* ─── Style Picker Row (text buttons) ────── */

function StyleRow({ label, items, value, onChange }: {
  label: string;
  items: { id: string; name: string }[];
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="customize-row">
      <div className="customize-row-header">
        <span className="customize-row-label">{label}</span>
      </div>
      <div className="customize-swatches" style={{ gap: 4 }}>
        {items.map(s => (
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

/* ─── Sub-tab Button ─────────────────────── */

function SubTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 0',
        fontSize: 10,
        fontFamily: 'var(--font-pixel, monospace)',
        fontWeight: 'bold',
        letterSpacing: 1,
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.35)',
        border: 'none',
        borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

/* ─── Character Editor ────────────────────── */

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAppearance(): CharacterAppearance {
  const hairStyles = getAllHairStyles();
  const outfitStyles = getAllOutfitStyles();
  const accessories = getAllAccessories();
  return {
    skinColor: pick(SKIN_PRESETS),
    hairColor: pick(HAIR_PRESETS),
    shirtColor: pick(SHIRT_PRESETS),
    pantsColor: pick(PANTS_PRESETS),
    shoeColor: pick(SHOE_PRESETS),
    hairStyle: pick(hairStyles)?.id,
    outfitStyle: pick(outfitStyles)?.id,
    accessory: pick(accessories)?.id,
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

type EditorTab = 'look' | 'outfit' | 'accessory';

export default function CharacterEditor({
  roleId, appearance, onChange, onRandomize, onReset, label,
}: CharacterEditorProps) {
  const [tab, setTab] = useState<EditorTab>('look');

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
      onChange({
        ...extracted,
        hairStyle: appearance.hairStyle,
        outfitStyle: appearance.outfitStyle,
        accessory: appearance.accessory,
      });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  }, [appearance.hairStyle, appearance.outfitStyle, appearance.accessory, onChange]);

  const hairStyles = getAllHairStyles();
  const outfitStyles = getAllOutfitStyles();
  const accessories = getAllAccessories();

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

      {/* Sub-tabs + content */}
      <div className="customize-colors">
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
          <SubTab label="LOOK" active={tab === 'look'} onClick={() => setTab('look')} />
          <SubTab label="OUTFIT" active={tab === 'outfit'} onClick={() => setTab('outfit')} />
          <SubTab label="ACCESSORY" active={tab === 'accessory'} onClick={() => setTab('accessory')} />
        </div>

        {tab === 'look' && (
          <>
            <ColorRow label="SKIN" presets={SKIN_PRESETS} value={appearance.skinColor} onChange={v => update('skinColor', v)} />
            <ColorRow label="HAIR COLOR" presets={HAIR_PRESETS} value={appearance.hairColor} onChange={v => update('hairColor', v)} />
            <StyleRow label="HAIR STYLE" items={hairStyles} value={appearance.hairStyle} onChange={v => update('hairStyle', v)} />
          </>
        )}
        {tab === 'outfit' && (
          <>
            <StyleRow label="STYLE" items={outfitStyles} value={appearance.outfitStyle} onChange={v => update('outfitStyle', v)} />
            <ColorRow label="TOP" presets={SHIRT_PRESETS} value={appearance.shirtColor} onChange={v => update('shirtColor', v)} />
            <ColorRow label="PANTS" presets={PANTS_PRESETS} value={appearance.pantsColor} onChange={v => update('pantsColor', v)} />
            <ColorRow label="SHOES" presets={SHOE_PRESETS} value={appearance.shoeColor} onChange={v => update('shoeColor', v)} />
          </>
        )}
        {tab === 'accessory' && (
          <>
            <StyleRow label="ACCESSORY" items={accessories} value={appearance.accessory} onChange={v => update('accessory', v)} />
            <div style={{
              marginTop: 12,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6,
              border: '1px dashed rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.25)',
              fontSize: 9,
              fontFamily: 'var(--font-pixel, monospace)',
              textAlign: 'center',
            }}>
              More accessories coming soon
            </div>
          </>
        )}
      </div>
    </>
  );
}
