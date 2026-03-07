/* =========================================================
   HAIR STYLE REGISTRY — Swappable hair layer variants

   Each hair style is a CharacterLayer (name: 'hair') that can
   replace the default hair layer in any CharacterBlueprint.
   ========================================================= */

import type { CharacterLayer } from './blueprint';

export interface HairStyleMeta {
  id: string;
  name: string;
  layer: CharacterLayer;
}

const registry = new Map<string, HairStyleMeta>();

export function registerHairStyle(id: string, name: string, layer: CharacterLayer): void {
  registry.set(id, { id, name, layer: { ...layer, name: 'hair' } });
}

export function getHairStyle(id: string): HairStyleMeta | undefined {
  return registry.get(id);
}

export function getAllHairStyles(): HairStyleMeta[] {
  return Array.from(registry.values());
}

/* ── Built-in Hair Styles (8 variants) ────────────── */

registerHairStyle('short', 'Short', {
  name: 'hair',
  pixels: [
    { x: 10, y: 0, w: 12, h: 3, c: '$hair' },
    { x: 8, y: 2, w: 2, h: 3, c: '$hair' },
    { x: 22, y: 2, w: 2, h: 3, c: '$hair' },
  ],
});

registerHairStyle('messy', 'Messy', {
  name: 'hair',
  pixels: [
    { x: 10, y: 0, w: 12, h: 3, c: '$hair' },
    { x: 8, y: 1, w: 4, h: 4, c: '$hair' },
    { x: 20, y: 0, w: 4, h: 5, c: '$hair' },
    { x: 14, y: 0, w: 2, h: 2, c: 'lighten($hair, 30)' },
  ],
});

registerHairStyle('bun', 'Bun', {
  name: 'hair',
  pixels: [
    { x: 10, y: 0, w: 12, h: 3, c: '$hair' },
    { x: 8, y: 2, w: 2, h: 4, c: '$hair' },
    { x: 22, y: 2, w: 2, h: 4, c: '$hair' },
    { x: 13, y: 0, w: 6, h: 4, c: 'lighten($hair, 20)' },
    { x: 14, y: 0, w: 4, h: 2, c: 'lighten($hair, 40)' },
  ],
});

registerHairStyle('long', 'Long', {
  name: 'hair',
  pixels: [
    { x: 8, y: 0, w: 16, h: 4, c: '$hair' },
    { x: 6, y: 2, w: 4, h: 8, c: '$hair' },
    { x: 22, y: 2, w: 4, h: 8, c: '$hair' },
    { x: 6, y: 8, w: 3, h: 6, c: 'darken($hair, 15)' },
    { x: 23, y: 8, w: 3, h: 6, c: 'darken($hair, 15)' },
  ],
});

registerHairStyle('mohawk', 'Mohawk', {
  name: 'hair',
  pixels: [
    { x: 13, y: -2, w: 6, h: 6, c: '$hair' },
    { x: 14, y: -3, w: 4, h: 3, c: 'lighten($hair, 20)' },
    { x: 10, y: 2, w: 3, h: 2, c: '$hair' },
    { x: 19, y: 2, w: 3, h: 2, c: '$hair' },
  ],
});

registerHairStyle('slicked', 'Slicked Back', {
  name: 'hair',
  pixels: [
    { x: 10, y: 0, w: 12, h: 2, c: '$hair' },
    { x: 8, y: 1, w: 2, h: 3, c: '$hair' },
    { x: 22, y: 1, w: 2, h: 3, c: '$hair' },
  ],
});

registerHairStyle('bob', 'Bob Cut', {
  name: 'hair',
  pixels: [
    { x: 8, y: 0, w: 16, h: 4, c: '$hair' },
    { x: 6, y: 2, w: 4, h: 6, c: '$hair' },
    { x: 22, y: 2, w: 4, h: 6, c: '$hair' },
    { x: 8, y: 6, w: 3, h: 2, c: 'darken($hair, 15)' },
    { x: 21, y: 6, w: 3, h: 2, c: 'darken($hair, 15)' },
  ],
});

registerHairStyle('curly', 'Curly', {
  name: 'hair',
  pixels: [
    { x: 8, y: 0, w: 16, h: 5, c: '$hair' },
    { x: 6, y: 1, w: 4, h: 6, c: '$hair' },
    { x: 22, y: 1, w: 4, h: 6, c: '$hair' },
    // Curly texture dots
    { x: 9, y: 1, w: 2, h: 2, c: 'lighten($hair, 25)' },
    { x: 15, y: 0, w: 2, h: 2, c: 'lighten($hair, 25)' },
    { x: 21, y: 1, w: 2, h: 2, c: 'lighten($hair, 25)' },
    { x: 12, y: 3, w: 2, h: 2, c: 'lighten($hair, 15)' },
    { x: 18, y: 3, w: 2, h: 2, c: 'lighten($hair, 15)' },
  ],
});
