/* =========================================================
   ACCESSORY REGISTRY — Swappable accessory layer variants

   Each accessory replaces the 'accessory' layer in a blueprint.
   Overlays on top of all other layers.
   All coordinates in MINI (12x22) scale.
   ========================================================= */

import type { CharacterLayer } from './blueprint';

export interface AccessoryMeta {
  id: string;
  name: string;
  layer: CharacterLayer;
}

const registry = new Map<string, AccessoryMeta>();

export function registerAccessory(id: string, name: string, layer: CharacterLayer): void {
  registry.set(id, { id, name, layer: { ...layer, name: 'accessory' } });
}

export function getAccessory(id: string): AccessoryMeta | undefined {
  return registry.get(id);
}

export function getAllAccessories(): AccessoryMeta[] {
  return Array.from(registry.values());
}

/* ── Built-in Accessories (mini 12x22 coords) ──────── */

// None — empty
registerAccessory('none', 'None', {
  name: 'accessory',
  pixels: [],
});

// Glasses — rectangular frames
registerAccessory('glasses', 'Glasses', {
  name: 'accessory',
  pixels: [
    { x: 2, y: 4, w: 3, h: 2, c: '#2A3A50', a: 0.5 },
    { x: 7, y: 4, w: 3, h: 2, c: '#2A3A50', a: 0.5 },
    { x: 5, y: 4, w: 2, h: 1, c: '#2A3A50', a: 0.3 },
  ],
});

// Round glasses
registerAccessory('round-glasses', 'Round Glasses', {
  name: 'accessory',
  pixels: [
    { x: 2, y: 3, w: 3, h: 3, c: '#8B7355', a: 0.4 },
    { x: 7, y: 3, w: 3, h: 3, c: '#8B7355', a: 0.4 },
    { x: 3, y: 4, w: 1, h: 1, c: '#B0E0FF', a: 0.15 },
    { x: 8, y: 4, w: 1, h: 1, c: '#B0E0FF', a: 0.15 },
    { x: 5, y: 4, w: 2, h: 1, c: '#8B7355', a: 0.3 },
  ],
});

// Sunglasses — dark lenses
registerAccessory('sunglasses', 'Sunglasses', {
  name: 'accessory',
  pixels: [
    { x: 2, y: 4, w: 3, h: 2, c: '#1A1A2E', a: 0.7 },
    { x: 7, y: 4, w: 3, h: 2, c: '#1A1A2E', a: 0.7 },
    { x: 5, y: 4, w: 2, h: 1, c: '#1A1A2E', a: 0.4 },
    { x: 3, y: 4, w: 1, h: 1, c: '#334', a: 0.3 },
    { x: 8, y: 4, w: 1, h: 1, c: '#334', a: 0.3 },
  ],
});

// Headphones — over-ear
registerAccessory('headphones', 'Headphones', {
  name: 'accessory',
  pixels: [
    // Headband
    { x: 0, y: 0, w: 12, h: 1, c: '#333', a: 0.7 },
    // Ear cups
    { x: -1, y: 1, w: 2, h: 5, c: '#444' },
    { x: 11, y: 1, w: 2, h: 5, c: '#444' },
    { x: -1, y: 2, w: 2, h: 3, c: '#555', a: 0.3 },
    { x: 11, y: 2, w: 2, h: 3, c: '#555', a: 0.3 },
  ],
});

// Beret — flat cap
registerAccessory('beret', 'Beret', {
  name: 'accessory',
  pixels: [
    { x: 2, y: -1, w: 8, h: 2, c: '#E91E63' },
    { x: 1, y: 0, w: 2, h: 1, c: '#E91E63', a: 0.6 },
    { x: 4, y: -1, w: 4, h: 1, c: '#F06292', a: 0.3 },
  ],
});

// Cap — baseball cap
registerAccessory('cap', 'Cap', {
  name: 'accessory',
  pixels: [
    { x: 1, y: -1, w: 10, h: 2, c: '#1565C0' },
    { x: 0, y: 1, w: 12, h: 1, c: '#0D47A1' },
    { x: 3, y: -1, w: 6, h: 1, c: '#1E88E5', a: 0.3 },
  ],
});

// Badge — ID badge on chest
registerAccessory('badge', 'Badge', {
  name: 'accessory',
  pixels: [
    // Lanyard
    { x: 5, y: 8, w: 2, h: 3, c: '#2196F3', a: 0.4 },
    // Badge
    { x: 4, y: 11, w: 4, h: 3, c: '#FFF', a: 0.5 },
    { x: 5, y: 12, w: 2, h: 1, c: '#333', a: 0.3 },
  ],
});

// Suit lapels — formal overlay
registerAccessory('lapels', 'Lapels', {
  name: 'accessory',
  pixels: [
    { x: 1, y: 10, w: 3, h: 2, c: '#1A1A2E', a: 0.4 },
    { x: 8, y: 10, w: 3, h: 2, c: '#1A1A2E', a: 0.4 },
  ],
});

// Blush — subtle cheek color
registerAccessory('blush', 'Blush', {
  name: 'accessory',
  pixels: [
    { x: 2, y: 6, w: 1, h: 1, c: '#FFCDD2', a: 0.3 },
    { x: 9, y: 6, w: 1, h: 1, c: '#FFCDD2', a: 0.3 },
  ],
});

// Scarf
registerAccessory('scarf', 'Scarf', {
  name: 'accessory',
  pixels: [
    { x: 2, y: 9, w: 8, h: 2, c: '#E53935', a: 0.6 },
    { x: 3, y: 9, w: 6, h: 1, c: '#EF5350', a: 0.3 },
    { x: 3, y: 11, w: 2, h: 3, c: '#E53935', a: 0.5 },
  ],
});

// Tie
registerAccessory('tie', 'Tie', {
  name: 'accessory',
  pixels: [
    // Knot
    { x: 5, y: 9, w: 2, h: 1, c: '#B71C1C' },
    // Tie body
    { x: 5, y: 10, w: 2, h: 4, c: '#D32F2F' },
    { x: 5, y: 10, w: 1, h: 4, c: '#E53935', a: 0.3 },
    // Tip
    { x: 5, y: 14, w: 2, h: 1, c: '#B71C1C', a: 0.8 },
  ],
});

// Bowtie
registerAccessory('bowtie', 'Bowtie', {
  name: 'accessory',
  pixels: [
    { x: 3, y: 9, w: 2, h: 1, c: '#D32F2F' },
    { x: 7, y: 9, w: 2, h: 1, c: '#D32F2F' },
    { x: 5, y: 9, w: 2, h: 1, c: '#B71C1C' },
    { x: 4, y: 9, w: 1, h: 1, c: '#E53935', a: 0.3 },
    { x: 7, y: 9, w: 1, h: 1, c: '#E53935', a: 0.3 },
  ],
});
