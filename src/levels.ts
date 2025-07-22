// Define features using bit flags
export enum Feature {
  CHAOS_WORDS = 1 << 0,
  MULTIZE_TOKENS = 1 << 1,
  EXLUDE_MAPPING_INFO = 1 << 2,
  MULTIZE_I_TOKENS = 1 << 3,
  PARTIAL_REASINING = 1 << 4,
}

export const levelMax = Object.values(Feature)
  .filter((v) => typeof v === "number")
  .reduce((ac, cur) => ac | cur, 0);

export function hasFeature(level: number, feature: Feature): boolean {
  return (level & feature) !== 0;
}
