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

export { extractAppearance } from './color-extract';
