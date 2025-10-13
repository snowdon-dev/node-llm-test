export interface PuzzleContext {
  /** The chosen pangram */
  chosen: readonly string[];

  /** items used when reading symbols */
  active?: readonly string[];

  /** all - pangrams - chaose words - extrawords */
  otherWords: readonly string[];

  /** list of wordlists */
  totalWordsBuckets: readonly (readonly string[])[];

  totalWords: string[];

  /** The smallest pangrams length. > 2, for randNot with 2 words. Itself and two words */
  minCount: number;
}
