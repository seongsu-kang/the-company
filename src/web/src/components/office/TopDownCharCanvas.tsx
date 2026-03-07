import { useRef, useEffect } from 'react';
import type { CharacterAppearance } from '../../types/appearance';
import { getCharacterBlueprint, renderCharacter } from './sprites/engine';
import './sprites/data'; // trigger blueprint registration

/**
 * TopDown-style pixel art character canvas using TyconoForge mini blueprints.
 * Renders a 12x22 mini blueprint at scale=1 on a 16x24 canvas (centered).
 */

const CW = 16, CH = 24;

const BOB_PERIOD = 60;
const PHASE_OFFSET: Record<string, number> = {
  cbo: 0, cto: 8, pm: 15, engineer: 22, designer: 5, qa: 12,
};

interface Props {
  roleId: string;
  className?: string;
  appearance?: CharacterAppearance;
  scale?: number;
}

export default function TopDownCharCanvas({ roleId, className, appearance, scale }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const apRef = useRef(appearance);
  apRef.current = appearance;

  const s = scale ?? 4;
  const w = CW * s;
  const h = CH * s;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const phase = PHASE_OFFSET[roleId] ?? 0;
    const bp = getCharacterBlueprint(`mini:${roleId}`) ?? getCharacterBlueprint('mini:default');

    const tick = () => {
      frameRef.current++;
      const ap = apRef.current;
      if (!ap || !bp) { rafRef.current = requestAnimationFrame(tick); return; }

      const cycleFrame = (frameRef.current + phase) % BOB_PERIOD;
      const bobY = cycleFrame < 30 ? 1 : 0;

      // Clear full canvas, then render blueprint offset to center it
      ctx.clearRect(0, 0, CW, CH);
      // Mini blueprint is 12x22, canvas is 16x24 → offset (2, 1)
      ctx.save();
      ctx.translate(2, 1);
      renderCharacter(ctx, bp, bobY, ap, 1);
      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [roleId]);

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block', width: w, height: h }}
    />
  );
}
