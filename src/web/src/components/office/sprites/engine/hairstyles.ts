/* =========================================================
   HAIR STYLE REGISTRY — Swappable hair layer variants

   Each hair style is a CharacterLayer (name: 'hair') that can
   replace the default hair layer in any CharacterBlueprint.

   All coordinates are in MINI (12x22) scale — the single
   source of truth for character blueprints.
   Head area: x:1..11, y:1..9
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

/* ── Built-in Hair Styles (8 variants, mini 12x22 coords) ── */

// Short — minimal top coverage
registerHairStyle('short', 'Short', {
  name: 'hair',
  pixels: [
    { x: 1, y: 0, w: 10, h: 2, c: '$hair' },
    { x: 0, y: 1, w: 2, h: 2, c: '$hair' },
    { x: 10, y: 1, w: 2, h: 2, c: '$hair' },
    { x: 2, y: 0, w: 8, h: 1, c: 'lighten($hair, 25)', a: 0.3 },
  ],
});

// Messy — spiky uneven top
registerHairStyle('messy', 'Messy', {
  name: 'hair',
  pixels: [
    { x: 1, y: 0, w: 10, h: 3, c: '$hair' },
    { x: 0, y: 1, w: 2, h: 3, c: '$hair' },
    { x: 10, y: 0, w: 2, h: 4, c: '$hair' },
    { x: 3, y: -1, w: 3, h: 2, c: '$hair' },
    { x: 7, y: -1, w: 2, h: 2, c: 'lighten($hair, 20)' },
    { x: 2, y: 0, w: 4, h: 1, c: 'lighten($hair, 30)', a: 0.3 },
  ],
});

// Bun — top knot
registerHairStyle('bun', 'Bun', {
  name: 'hair',
  pixels: [
    { x: 1, y: 0, w: 10, h: 2, c: '$hair' },
    { x: 0, y: 1, w: 2, h: 2, c: '$hair' },
    { x: 10, y: 1, w: 2, h: 2, c: '$hair' },
    { x: 4, y: -2, w: 4, h: 3, c: '$hair' },
    { x: 5, y: -2, w: 2, h: 1, c: 'lighten($hair, 30)', a: 0.4 },
  ],
});

// Long — flowing sides
registerHairStyle('long', 'Long', {
  name: 'hair',
  pixels: [
    { x: 0, y: 0, w: 12, h: 3, c: '$hair' },
    { x: -1, y: 1, w: 2, h: 7, c: '$hair' },
    { x: 11, y: 1, w: 2, h: 7, c: '$hair' },
    { x: -1, y: 6, w: 2, h: 3, c: 'darken($hair, 15)', a: 0.5 },
    { x: 11, y: 6, w: 2, h: 3, c: 'darken($hair, 15)', a: 0.5 },
    { x: 2, y: 0, w: 8, h: 1, c: 'lighten($hair, 25)', a: 0.3 },
  ],
});

// Mohawk — center spike
registerHairStyle('mohawk', 'Mohawk', {
  name: 'hair',
  pixels: [
    { x: 4, y: -2, w: 4, h: 4, c: '$hair' },
    { x: 5, y: -3, w: 2, h: 2, c: 'lighten($hair, 20)' },
    { x: 1, y: 1, w: 3, h: 2, c: '$hair' },
    { x: 8, y: 1, w: 3, h: 2, c: '$hair' },
  ],
});

// Slicked back — flat smooth
registerHairStyle('slicked', 'Slicked Back', {
  name: 'hair',
  pixels: [
    { x: 1, y: 0, w: 10, h: 2, c: '$hair' },
    { x: 0, y: 1, w: 2, h: 2, c: '$hair' },
    { x: 10, y: 1, w: 2, h: 2, c: '$hair' },
    { x: 2, y: 0, w: 8, h: 1, c: 'lighten($hair, 15)', a: 0.4 },
    { x: 3, y: 1, w: 6, h: 1, c: 'lighten($hair, 10)', a: 0.2 },
  ],
});

// Bob — chin-length sides
registerHairStyle('bob', 'Bob Cut', {
  name: 'hair',
  pixels: [
    { x: 0, y: 0, w: 12, h: 3, c: '$hair' },
    { x: -1, y: 1, w: 2, h: 5, c: '$hair' },
    { x: 11, y: 1, w: 2, h: 5, c: '$hair' },
    { x: -1, y: 5, w: 2, h: 1, c: 'darken($hair, 15)', a: 0.4 },
    { x: 11, y: 5, w: 2, h: 1, c: 'darken($hair, 15)', a: 0.4 },
    { x: 2, y: 0, w: 8, h: 1, c: 'lighten($hair, 25)', a: 0.3 },
  ],
});

// Curly — textured volume
registerHairStyle('curly', 'Curly', {
  name: 'hair',
  pixels: [
    { x: 0, y: 0, w: 12, h: 4, c: '$hair' },
    { x: -1, y: 1, w: 2, h: 5, c: '$hair' },
    { x: 11, y: 1, w: 2, h: 5, c: '$hair' },
    // Curly texture dots
    { x: 2, y: 0, w: 2, h: 1, c: 'lighten($hair, 25)', a: 0.4 },
    { x: 6, y: 0, w: 2, h: 1, c: 'lighten($hair, 25)', a: 0.4 },
    { x: 4, y: 2, w: 2, h: 1, c: 'lighten($hair, 15)', a: 0.3 },
    { x: 8, y: 2, w: 2, h: 1, c: 'lighten($hair, 15)', a: 0.3 },
  ],
});
