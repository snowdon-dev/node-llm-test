import { instructionSet, pangramsDefault } from "./characters";
import { PuzzleContext } from "./models/PuzzleContext";
import { OtherWordsService } from "./services/OtherWordsService";
import { LevelsType } from "./levels";
import { IRandom } from "./IRandom";

function collectWords(obj: any, words = new Set<string>()): Set<string> {
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      // Split on whitespace, trim, and add each word to the set
      const parts = value.trim().split(/\s+/);
      for (const word of parts) {
        if (word) words.add(word);
      }
    } else if (typeof value === "object" && value !== null) {
      // Recurse into nested objects
      collectWords(value, words);
    }
  }
  return words;
}

let instructionWordCache: string[];

function getInstructionWords() {
  if (instructionWordCache) return instructionWordCache;
  return (instructionWordCache = Array.from(collectWords(instructionSet)));
}

export class PuzzleContextFactory {
  constructor(
    private readonly otherWordsFact: OtherWordsService,
    private readonly random: IRandom,
    private readonly pangrams: readonly string[],
    private readonly inputWords: readonly string[],
    public readonly level: Pick<
      LevelsType,
      "EXTRA_WORDS" | "ENCODE_INSTRUCTIONS"
    >,
  ) {}

  create() {
    const { words, pangramsWordsList, minCount } = this.prepareActivePangram();

    const instructioWords = this.level.ENCODE_INSTRUCTIONS
      ? getInstructionWords()
      : null;

    const input = [this.inputWords];
    if (instructioWords) input.push(instructioWords);

    const otherSet = this.otherWordsFact.build(input, pangramsWordsList, words);
    const otherWords = Array.from(otherSet);

    const active = pangramsWordsList;

    const totalWordsBuckets = [
      ...[otherWords, active].filter((v) => v !== void 0),
      words,
    ];

    const context: PuzzleContext = {
      chosen: words,
      active: pangramsWordsList,
      otherWords,
      totalWordsBuckets,
      totalWords: otherWords.concat(
        Array.from(new Set([...words, ...(active ?? [])])),
      ),
      minCount,
    };

    if (minCount < 3) throw new TypeError();

    return context;
  }

  private prepareActivePangram() {
    const sentenceIdx = this.random.rand(this.pangrams.length - 1);

    let pangramsWordsList: readonly string[] | undefined;
    let words: readonly string[];

    let tmpPangrams: readonly (readonly string[])[];
    const usingDefault = this.pangrams === pangramsDefault;

    if (!usingDefault) {
      tmpPangrams = this.pangrams.map((p) => p.split(/\s/));
    } else {
      if (pangramsDefaultCache === undefined) {
        tmpPangrams = pangramsDefaultCache = pangramsDefault.map((p) =>
          p.split(/\s/),
        );
      } else {
        tmpPangrams = pangramsDefaultCache;
      }
    }

    const minCount = Math.min(...tmpPangrams.map((v) => v.length));

    if (this.level.EXTRA_WORDS) {
      pangramsWordsList = tmpPangrams
        .filter((_, i) => i !== sentenceIdx)
        .flat();
      words = tmpPangrams[sentenceIdx];
    } else {
      pangramsWordsList = undefined;
      words = tmpPangrams[sentenceIdx];
    }

    return { words, pangramsWordsList, minCount };
  }
}

export let pangramsDefaultCache: readonly (readonly string[])[] | undefined =
  undefined;
