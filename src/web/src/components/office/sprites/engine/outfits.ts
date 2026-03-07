/* =========================================================
   OUTFIT STYLE REGISTRY — Swappable torso layer variants

   Each outfit replaces the 'torso' layer in a blueprint.
   Torso area: shirt body (y:10..16) + arms (y:11..16).
   All coordinates in MINI (12x22) scale.
   ========================================================= */

import type { CharacterLayer } from './blueprint';
import type { DirectionalLayers, Direction } from './blueprint';
import { resolveDirectionalLayer } from './blueprint';

export interface OutfitStyleMeta {
  id: string;
  name: string;
  layer: CharacterLayer;
  directions?: DirectionalLayers;
}

const registry = new Map<string, OutfitStyleMeta>();

export function registerOutfitStyle(
  id: string,
  name: string,
  layerOrDirs: CharacterLayer | DirectionalLayers,
): void {
  const isDirectional = 'down' in layerOrDirs && !('pixels' in layerOrDirs);
  if (isDirectional) {
    const dirs = layerOrDirs as DirectionalLayers;
    registry.set(id, {
      id,
      name,
      layer: { ...dirs.down, name: 'torso' },
      directions: {
        down: { ...dirs.down, name: 'torso' },
        up: dirs.up ? { ...dirs.up, name: 'torso' } : undefined,
        left: dirs.left ? { ...dirs.left, name: 'torso' } : undefined,
        right: dirs.right ? { ...dirs.right, name: 'torso' } : undefined,
      },
    });
  } else {
    const layer = layerOrDirs as CharacterLayer;
    registry.set(id, { id, name, layer: { ...layer, name: 'torso' } });
  }
}

export function getOutfitStyle(id: string): OutfitStyleMeta | undefined {
  return registry.get(id);
}

export function getOutfitForDirection(id: string, dir: Direction): CharacterLayer | undefined {
  const meta = registry.get(id);
  if (!meta) return undefined;
  if (meta.directions) return resolveDirectionalLayer(meta.directions, dir);
  return meta.layer;
}

export function getAllOutfitStyles(): OutfitStyleMeta[] {
  return Array.from(registry.values());
}

/* ── Built-in Outfit Styles (mini 12x22 coords) ──────── */

// T-shirt — basic default
registerOutfitStyle('tshirt', 'T-Shirt', {
  name: 'torso',
  pixels: [
    // Shirt body
    { x: 1, y: 10, w: 10, h: 6, c: '$shirt' },
    { x: 2, y: 10, w: 8, h: 1, c: 'lighten($shirt, 18)', a: 0.3 },
    { x: 1, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    { x: 10, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    // Arms (short sleeves)
    { x: -1, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 2, h: 5, c: '$shirt' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Suit — formal jacket with collar
registerOutfitStyle('suit', 'Suit', {
  name: 'torso',
  pixels: [
    // Jacket body
    { x: 1, y: 10, w: 10, h: 6, c: '$shirt' },
    { x: 2, y: 10, w: 8, h: 1, c: 'lighten($shirt, 12)', a: 0.3 },
    { x: 1, y: 10, w: 1, h: 5, c: 'darken($shirt, 30)', a: 0.3 },
    { x: 10, y: 10, w: 1, h: 5, c: 'darken($shirt, 30)', a: 0.3 },
    // Lapels
    { x: 2, y: 10, w: 3, h: 3, c: 'darken($shirt, 20)', a: 0.3 },
    { x: 7, y: 10, w: 3, h: 3, c: 'darken($shirt, 20)', a: 0.3 },
    // White shirt underneath (center line)
    { x: 5, y: 10, w: 2, h: 5, c: '#E8E8E8', a: 0.5 },
    // Suit arms (long sleeves)
    { x: -1, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: -1, y: 11, w: 2, h: 1, c: 'darken($shirt, 20)', a: 0.2 },
    { x: 11, y: 11, w: 2, h: 1, c: 'darken($shirt, 20)', a: 0.2 },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Hoodie — casual with hood outline
registerOutfitStyle('hoodie', 'Hoodie', {
  name: 'torso',
  pixels: [
    // Main body (slightly wider feel)
    { x: 0, y: 10, w: 12, h: 6, c: '$shirt' },
    { x: 1, y: 10, w: 10, h: 1, c: 'lighten($shirt, 15)', a: 0.25 },
    { x: 0, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.3 },
    { x: 11, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.3 },
    // Hood behind neck
    { x: 2, y: 8, w: 8, h: 2, c: '$shirt', a: 0.4 },
    // Front pocket
    { x: 3, y: 13, w: 6, h: 2, c: 'darken($shirt, 15)', a: 0.2 },
    // Drawstrings
    { x: 5, y: 10, w: 1, h: 2, c: '#DDD', a: 0.3 },
    { x: 6, y: 10, w: 1, h: 2, c: '#DDD', a: 0.3 },
    // Arms
    { x: -1, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 2, h: 5, c: '$shirt' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Vest — sleeveless with visible arms
registerOutfitStyle('vest', 'Vest', {
  name: 'torso',
  pixels: [
    // Vest body
    { x: 1, y: 10, w: 10, h: 6, c: '$shirt' },
    { x: 2, y: 10, w: 8, h: 1, c: 'lighten($shirt, 18)', a: 0.3 },
    { x: 1, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    { x: 10, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    // V-neck
    { x: 5, y: 10, w: 2, h: 2, c: '$skin', a: 0.6 },
    // Bare arms (skin color)
    { x: -1, y: 11, w: 2, h: 5, c: '$skin' },
    { x: 11, y: 11, w: 2, h: 5, c: '$skin' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: 'darken($skin, 10)' },
    { x: 11, y: 15, w: 2, h: 1, c: 'darken($skin, 10)' },
  ],
});

// Tank top — minimal coverage
registerOutfitStyle('tank', 'Tank Top', {
  name: 'torso',
  pixels: [
    // Narrow body
    { x: 2, y: 10, w: 8, h: 6, c: '$shirt' },
    { x: 3, y: 10, w: 6, h: 1, c: 'lighten($shirt, 18)', a: 0.3 },
    { x: 2, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    { x: 9, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    // Exposed shoulders
    { x: 0, y: 10, w: 2, h: 2, c: '$skin' },
    { x: 10, y: 10, w: 2, h: 2, c: '$skin' },
    // Bare arms
    { x: -1, y: 11, w: 2, h: 5, c: '$skin' },
    { x: 11, y: 11, w: 2, h: 5, c: '$skin' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: 'darken($skin, 10)' },
    { x: 11, y: 15, w: 2, h: 1, c: 'darken($skin, 10)' },
  ],
});

// Polo — collar detail
registerOutfitStyle('polo', 'Polo', {
  name: 'torso',
  pixels: [
    // Shirt body
    { x: 1, y: 10, w: 10, h: 6, c: '$shirt' },
    { x: 2, y: 10, w: 8, h: 1, c: 'lighten($shirt, 18)', a: 0.3 },
    { x: 1, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    { x: 10, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    // Collar
    { x: 3, y: 9, w: 6, h: 2, c: 'lighten($shirt, 25)', a: 0.5 },
    { x: 5, y: 9, w: 2, h: 1, c: '$skin', a: 0.4 },
    // Button placket
    { x: 5, y: 10, w: 2, h: 3, c: 'darken($shirt, 15)', a: 0.15 },
    // Arms
    { x: -1, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 2, h: 5, c: '$shirt' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Lab Coat — white coat over shirt
registerOutfitStyle('labcoat', 'Lab Coat', {
  name: 'torso',
  pixels: [
    // Inner shirt (visible at center)
    { x: 4, y: 10, w: 4, h: 5, c: '$shirt' },
    // Coat body
    { x: 0, y: 10, w: 4, h: 7, c: '#F0F0F0' },
    { x: 8, y: 10, w: 4, h: 7, c: '#F0F0F0' },
    // Coat top (shoulders)
    { x: 1, y: 10, w: 10, h: 1, c: '#FAFAFA' },
    // Coat edges shadow
    { x: 0, y: 10, w: 1, h: 7, c: '#DDD', a: 0.5 },
    { x: 11, y: 10, w: 1, h: 7, c: '#DDD', a: 0.5 },
    // Pockets
    { x: 1, y: 13, w: 2, h: 2, c: '#E0E0E0', a: 0.4 },
    { x: 9, y: 13, w: 2, h: 2, c: '#E0E0E0', a: 0.4 },
    // Arms (white sleeves)
    { x: -1, y: 11, w: 2, h: 5, c: '#F0F0F0' },
    { x: 11, y: 11, w: 2, h: 5, c: '#F0F0F0' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Overalls — denim work outfit
registerOutfitStyle('overalls', 'Overalls', {
  name: 'torso',
  pixels: [
    // Undershirt
    { x: 1, y: 10, w: 10, h: 3, c: '$shirt' },
    { x: 2, y: 10, w: 8, h: 1, c: 'lighten($shirt, 18)', a: 0.3 },
    // Overall bib (denim blue over chest)
    { x: 3, y: 11, w: 6, h: 5, c: '#3D6B99' },
    // Straps
    { x: 3, y: 10, w: 2, h: 1, c: '#3D6B99' },
    { x: 7, y: 10, w: 2, h: 1, c: '#3D6B99' },
    // Button clasps
    { x: 3, y: 11, w: 1, h: 1, c: '#FFD700', a: 0.6 },
    { x: 8, y: 11, w: 1, h: 1, c: '#FFD700', a: 0.6 },
    // Side panels
    { x: 1, y: 13, w: 2, h: 3, c: '#3D6B99' },
    { x: 9, y: 13, w: 2, h: 3, c: '#3D6B99' },
    // Pocket on bib
    { x: 5, y: 13, w: 2, h: 2, c: '#345E87', a: 0.4 },
    // Arms (shirt sleeves)
    { x: -1, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 2, h: 5, c: '$shirt' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Turtleneck — high collar
registerOutfitStyle('turtleneck', 'Turtleneck', {
  name: 'torso',
  pixels: [
    // Body
    { x: 1, y: 10, w: 10, h: 6, c: '$shirt' },
    { x: 1, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    { x: 10, y: 10, w: 1, h: 5, c: 'darken($shirt, 25)', a: 0.25 },
    // High collar
    { x: 3, y: 8, w: 6, h: 2, c: '$shirt' },
    { x: 4, y: 8, w: 4, h: 1, c: 'lighten($shirt, 12)', a: 0.3 },
    { x: 3, y: 9, w: 1, h: 1, c: 'darken($shirt, 15)', a: 0.2 },
    { x: 8, y: 9, w: 1, h: 1, c: 'darken($shirt, 15)', a: 0.2 },
    // Arms
    { x: -1, y: 11, w: 2, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 2, h: 5, c: '$shirt' },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});

// Kimono / Robe — wrap style
registerOutfitStyle('robe', 'Robe', {
  name: 'torso',
  pixels: [
    // Main body
    { x: 0, y: 10, w: 12, h: 7, c: '$shirt' },
    { x: 0, y: 10, w: 1, h: 6, c: 'darken($shirt, 25)', a: 0.3 },
    { x: 11, y: 10, w: 1, h: 6, c: 'darken($shirt, 25)', a: 0.3 },
    // Wrap V-overlap
    { x: 3, y: 10, w: 3, h: 4, c: 'lighten($shirt, 15)', a: 0.25 },
    { x: 6, y: 10, w: 3, h: 4, c: 'darken($shirt, 10)', a: 0.2 },
    // Belt / obi
    { x: 1, y: 14, w: 10, h: 1, c: 'darken($shirt, 35)' },
    { x: 2, y: 14, w: 8, h: 1, c: 'darken($shirt, 25)', a: 0.4 },
    // Wide sleeves
    { x: -2, y: 11, w: 3, h: 5, c: '$shirt' },
    { x: 11, y: 11, w: 3, h: 5, c: '$shirt' },
    { x: -2, y: 15, w: 3, h: 1, c: 'darken($shirt, 15)', a: 0.3 },
    { x: 11, y: 15, w: 3, h: 1, c: 'darken($shirt, 15)', a: 0.3 },
    // Hands
    { x: -1, y: 15, w: 2, h: 1, c: '$skin' },
    { x: 11, y: 15, w: 2, h: 1, c: '$skin' },
  ],
});
