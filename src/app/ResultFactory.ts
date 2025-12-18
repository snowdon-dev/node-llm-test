import { IRandom } from "../domain/IRandom";
import { OtherWordsService } from "../domain/services/OtherWordsService";
import { PuzzleContextFactory } from "../domain/PuzzleContextFactory";
import { PuzzleGenerator } from "../domain/services/PuzzleGenerator";
import { MappingTransformer } from "../domain/services/MappingTransformer";
import { AppConfig } from "./interface";

export function makeResultFactory(
  random: IRandom,
  config: AppConfig,
  inputWords: readonly string[],
  pangrams: readonly string[],
) {
  const otherWordsFact = new OtherWordsService({
    extraWords: config.level.EXTRA_WORDS,
    chaosWords: config.level.CHAOS_WORDS,
  });

  const context = new PuzzleContextFactory(
    otherWordsFact,
    random,
    pangrams,
    inputWords,
    config.level,
  );

  const opts = {
    multiInput: config.level.MULTIZE_I_TOKENS,
    multiTokens: config.level.MULTIZE_TOKENS,
  };

  const mappings = new MappingTransformer(random, opts);
  return new PuzzleGenerator(random, mappings, context, config);
}
