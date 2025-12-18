import MissingWordRunner from "../app/MissingWordRunner";
import { enumFlagsToBooleans, Feature, levelMax } from "../domain/levels";
import { RandomSource } from "./random";
import * as config from "./config";
import { AppConfig } from "../app/interface";

function createConfig(
  level: number,
  pangrams: readonly string[],
  seed: number | null,
): AppConfig {
  validateSeed(seed);
  validateLevel(level);
  validatePangrams(pangrams);
  const levelType = enumFlagsToBooleans(Feature, level);
  return { ...config, level: levelType, pangrams, seed };
}

export function createApp(
  level: number,
  seed: number | null,
  inputWords: readonly string[],
  pangrams: readonly string[],
) {
  const config = createConfig(level, pangrams, seed);

  const random = RandomSource.New(
    seed !== null ? RandomSource.TYPES[0] : RandomSource.TYPES[1],
    seed,
  );
  return new MissingWordRunner(random, config, inputWords, pangrams);
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
