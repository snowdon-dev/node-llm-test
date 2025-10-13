import { IRandom } from "../domain/IRandom";
import { LevelsType } from "../domain/levels";
import { OtherWordsService } from "../domain/services/OtherWordsService";
import { PuzzleContextFactory } from "../domain/PuzzleContextFactory";
import { PuzzleGenerator } from "../domain/services/PuzzleGenerator";
import { MappingTransformer } from "../domain/services/MappingTransformer";

export function makeResultFactory(
  random: IRandom,
  level: LevelsType,
  inputWords: readonly string[],
  pangrams: readonly string[],
) {
  const otherWordsFact = new OtherWordsService({
    extraWords: level.EXTRA_WORDS,
    chaosWords: level.CHAOS_WORDS,
  });

  const context = new PuzzleContextFactory(
    otherWordsFact,
    random,
    pangrams,
    inputWords,
    level,
  );

  const opts = {
    multiInput: level.MULTIZE_I_TOKENS,
    multiTokens: level.MULTIZE_TOKENS,
  };

  const mappings = new MappingTransformer(random, opts);
  return new PuzzleGenerator(random, mappings, level, context);
}
