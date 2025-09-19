// Define features using bit flags
export enum Feature {
  // Increases the number of total words by ~ words in the domain * 2.
  CHAOS_WORDS = 1 << 0,
  MULTIZE_TOKENS = 1 << 1,
  EXCLUDE_MAPPING_INFO = 1 << 2,
  MULTIZE_I_TOKENS = 1 << 3,
  PARTIAL_REASINING = 1 << 4,

  // tokens are ran through a function, which is shown the the AI
  // ROT13(symbolised) etc...
  INDIRECT_SYMBOLS = 1 << 5,

  EXCLUDE_SENTENCE_SPACES = 1 << 6,

  INSTRUCTION_ORDER = 1 << 7,

  // exlcude the shift details to require frequency analysis step before
  // getting the instructions
  OUTPUT_SHIFT = 1 << 8,
  OUTPUT_SHIFT_EXLCUDE_DETAILS = 1 << 9,

  MAPPING_INFO_PUZZLE = 1 << 10,

  POOR_CODING_STANDARDS = 1 << 11,

  EXTRA_WORDS = 1 << 12,

  //MISSING_SENTENCE = 1 << 7,
}

export const levelMax = Object.values(Feature)
  .filter((v) => typeof v === "number")
  .reduce((ac, cur) => ac | cur, 0);

export function hasFeature(level: number, feature: Feature): boolean {
  return (level & feature) !== 0;
}
