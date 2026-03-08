/* ═══════════════════════════════════════════
   Furniture Types — Data-Driven Definitions
   Phase 1: Room-relative offset system
   ═══════════════════════════════════════════ */

export type FurnitureType =
  | 'bookshelf' | 'plant' | 'meeting-table' | 'sofa'
  | 'coffee-table' | 'coffee-machine'
  | 'window' | 'picture' | 'clock' | 'whiteboard'
  | 'bulletin-board' | 'shelf' | 'screen';

export type PlacementZone = 'wall' | 'floor';
export type AnchorX = 'left' | 'right';

export interface FacilityInfo {
  id: string;
  label: string;
  icon: string;
  color: string;
  hitW: number;
  hitH: number;
}

export interface FurnitureDef {
  id: string;
  type: FurnitureType;
  room: string;
  zone: PlacementZone;
  anchorX?: AnchorX;       // default 'left'; 'right' = baseX is room right edge
  offsetX: number;
  offsetY: number;
  accent?: string;         // bookshelf accent color
  pictureColor?: string;   // picture frame color
  windowW?: number;        // window dimensions override
  windowH?: number;
  condition?: 'no-desks';  // only render when room has no desks
  facility?: FacilityInfo;
  w?: number; h?: number;  // furniture dimensions (for Phase 2)
}

/* ─── Furniture Catalog (for add palette) ─ */

export interface CatalogEntry {
  type: FurnitureType;
  zone: PlacementZone;
  label: string;
  icon: string;
}

export const FURNITURE_CATALOG: CatalogEntry[] = [
  { type: 'plant', zone: 'floor', label: 'Plant', icon: '🪴' },
  { type: 'bookshelf', zone: 'floor', label: 'Bookshelf', icon: '📚' },
  { type: 'sofa', zone: 'floor', label: 'Sofa', icon: '🛋️' },
  { type: 'coffee-table', zone: 'floor', label: 'Coffee Table', icon: '☕' },
  { type: 'coffee-machine', zone: 'floor', label: 'Coffee Machine', icon: '☕' },
  { type: 'meeting-table', zone: 'floor', label: 'Meeting Table', icon: '🪑' },
  { type: 'window', zone: 'wall', label: 'Window', icon: '🪟' },
  { type: 'picture', zone: 'wall', label: 'Picture', icon: '🖼️' },
  { type: 'clock', zone: 'wall', label: 'Clock', icon: '🕐' },
  { type: 'whiteboard', zone: 'wall', label: 'Whiteboard', icon: '📋' },
  { type: 'shelf', zone: 'wall', label: 'Shelf', icon: '📦' },
  { type: 'screen', zone: 'wall', label: 'Screen', icon: '🖥️' },
];
