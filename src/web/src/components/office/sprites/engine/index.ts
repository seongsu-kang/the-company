export type {
  ColorToken,
  Pixel,
  CharacterBlueprint,
  CharacterLayer,
  FacilityBlueprint,
} from './blueprint';

export {
  darken,
  lighten,
  resolveColor,
  swapHairLayer,
  swapLayer,
  registerCharacter,
  registerFacility,
  getCharacterBlueprint,
  getFacilityBlueprint,
  getAllCharacterIds,
  getAllFacilityIds,
} from './blueprint';

export {
  renderCharacter,
  renderFacility,
  renderLayerToCanvas,
  composeLayers,
  renderPixelsAt,
} from './renderer';

export type { HairStyleMeta } from './hairstyles';

export {
  registerHairStyle,
  getHairStyle,
  getAllHairStyles,
} from './hairstyles';

export type { OutfitStyleMeta } from './outfits';

export {
  registerOutfitStyle,
  getOutfitStyle,
  getAllOutfitStyles,
} from './outfits';

export type { AccessoryMeta } from './accessories';

export {
  registerAccessory,
  getAccessory,
  getAllAccessories,
} from './accessories';

export { extractAppearance } from './color-extract';
