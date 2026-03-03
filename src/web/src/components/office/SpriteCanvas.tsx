import { useRef, useEffect } from 'react';
import {
  drawCTO, drawCBO, drawPM, drawEngineer, drawDesigner, drawQA, drawDefault,
} from './sprites/spriteDrawing';

/* Phase offsets match POC exactly */
const PHASE_OFFSET: Record<string, number> = {
  cbo: 0, cto: 8, pm: 15, engineer: 22, designer: 5, qa: 12,
};

const DRAW_FN: Record<string, (ctx: CanvasRenderingContext2D, bobY: number) => void> = {
  cto: drawCTO,
  cbo: drawCBO,
  pm: drawPM,
  engineer: drawEngineer,
  designer: drawDesigner,
  qa: drawQA,
};

const BOB_PERIOD = 60;

interface Props {
  roleId: string;
  className?: string;
}

export default function SpriteCanvas({ roleId, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFn = DRAW_FN[roleId] ?? drawDefault;

    const phase = PHASE_OFFSET[roleId] ?? 0;

    const tick = () => {
      frameRef.current++;
      const cycleFrame = (frameRef.current + phase) % BOB_PERIOD;
      const bobY = cycleFrame < 30 ? 1 : 0;
      drawFn(ctx, bobY);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [roleId]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={80}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
}
