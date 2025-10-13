import MissingWordRunner from "../app/MissingWordRunner";
import { enumFlagsToBooleans, Feature, levelMax } from "../domain/levels";
import { RandomSource } from "./random";

export function createApp(
  level: number,
  seed: number | null,
  inputWords: readonly string[],
  pangrams: readonly string[],
) {
  validateLevel(level);
  validateSeed(seed);
  validatePangrams(pangrams);

  const random = RandomSource.New(
    seed !== null ? RandomSource.TYPES[0] : RandomSource.TYPES[1],
    seed,
  );
  const levels = enumFlagsToBooleans(Feature, level);
  return new MissingWordRunner(random, levels, inputWords, pangrams);
}

const validatePangrams = (list: readonly string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("Invalid pangram list");
  }
};

const validateLevel = (i: number) => {
  if (!(i >= 0 && i <= levelMax)) {
    throw new TypeError("Invalid level");
  }
};

const validateSeed = (num: number | null) => {
  const isNum = typeof num === "number";
  if (isNum && !(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  } else if (!isNum && num !== null) {
    throw new TypeError("Invalid seed prop");
  }
};
