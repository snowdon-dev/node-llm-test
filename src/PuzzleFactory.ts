import {
  blankWordToken,
  chaosWords,
  capitalizeFirstLetter,
  rotN,
  toBinary,
  equalSymblsSet,
  reverseFirstLetter,
  spacingChars,
} from "./characters";
import {
  IPrepareResult,
  SymbolExpression,
  SymbolTypeOptions,
  IExpressionResult,
  ExpressionPart,
  ExpressionDefinitionType,
} from "./interface";
import { hasFeature, Feature, levelMax } from "./levels";
import { mulberry32, getRandomOrder, pickRandomBucket } from "./random";

type SymbolType = [string] | [string, string];

type BucketType = readonly (readonly string[])[];

class SymbolFactory {
  constructor(
    private readonly rand: (num: number) => number,
    private readonly options: Readonly<{
      chaosWords: boolean;
      extraWords: boolean;
      multiTokens: boolean;
      multiInput: boolean;
    }>,
  ) {}

  protected preapreOtherWords(
    input: readonly string[],
    activeBuckets: BucketType,
    pangramsWordsList: readonly string[],
    words: readonly string[],
  ) {
    const excludeWordsSet = new Set(activeBuckets.flat());
    const otherWords = new Set<string>();
    for (let i = 0; i < input.length; i++) {
      if (!excludeWordsSet.has(input[i])) {
        otherWords.add(input[i]);
      }
      if (this.options.chaosWords) {
        const other = reverseFirstLetter(input[i]);
        if (!excludeWordsSet.has(other)) {
          otherWords.add(other);
        }
      }
    }
    if (this.options.extraWords) {
      for (let i = 0; i < pangramsWordsList.length; i++) {
        const v = pangramsWordsList[i];
        const word = reverseFirstLetter(v);
        if (!excludeWordsSet.has(word)) {
          otherWords.add(word);
        }
      }
      for (let elm of chaosWords) {
        const lower = elm.toLowerCase();
        if (!excludeWordsSet.has(lower)) {
          otherWords.add(lower);
        }
        const upper = capitalizeFirstLetter(lower);
        if (!excludeWordsSet.has(upper)) {
          otherWords.add(upper);
        }
      }
    }

    if (this.options.chaosWords) {
      for (let i = 0; i < words.length; i++) {
        const reversed = reverseFirstLetter(words[i]);
        if (!excludeWordsSet.has(reversed)) {
          otherWords.add(reversed);
        }
      }
    }

    return otherWords;
  }

  public buildSymbols(
    inputWords: readonly string[],
    activePanagram: readonly string[],
    pangramsWordsList: readonly string[] | undefined,
  ) {
    const activeBuckets = [activePanagram, pangramsWordsList ?? []];
    const otherWords = this.preapreOtherWords(
      inputWords,
      activeBuckets,
      pangramsWordsList,
      activePanagram,
    );

    const useMultiInput = this.options.multiInput;
    const useMultiTokens = this.options.multiTokens;

    const otherWordBuckets = [Array.from(otherWords), pangramsWordsList].filter(
      (v) => v !== void 0,
    );
    const totalWordBuckets = [...otherWordBuckets, activePanagram];

    const totalBucketLength = totalWordBuckets.reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    const readWords = (idx: number, array: readonly string[]) => {
      const multiWordRoll =
        useMultiInput && this.rand(1) > 0 ? idx !== array.length - 1 : false;

      const word = array[idx];
      let words: SymbolType;

      if (multiWordRoll) {
        // sometimes takes two words
        const nextWord = array[idx + 1];
        words = [word, nextWord];
      } else {
        words = [word];
      }

      return words;
    };

    const totalSymbols: string[] = [];

    const pickMissingSymbol = (words: SymbolType) => {
      if (words.length === 2) {
        return [[words[0]], [words[1]]];
      }

      const [idx, bucket] = pickRandomBucket(
        totalWordBuckets,
        totalBucketLength,
        this.rand,
      );

      return [[words[0], bucket[idx]]];
    };

    const findSymbols = (words: SymbolType) => {
      if (useMultiTokens && useMultiInput) {
        return [words, ...pickMissingSymbol(words)].map((s) =>
          s.join(spacingChars),
        );
      }
      return [words.join(spacingChars)];
    };

    function buildWords(arr: readonly string[]) {
      for (let i = 0; i < arr.length; i++) {
        const words = readWords(i, arr);
        totalSymbols.push(...findSymbols(words));
        i += words.length - 1;
      }
    }

    otherWordBuckets.forEach((bucket) => buildWords(bucket));

    const tokenStartWordIdx: number[] = [];
    const sentenceWordsSymbols: string[] = [];
    let wordIdx = 0;
    for (let npwi = 0; npwi < activePanagram.length; npwi++) {
      const tmpWords = readWords(npwi, activePanagram);
      const symbolStrs = findSymbols(tmpWords);

      tokenStartWordIdx.push(wordIdx);
      totalSymbols.push(...symbolStrs);
      sentenceWordsSymbols.push(symbolStrs[0]);

      npwi += tmpWords.length - 1;
      wordIdx += tmpWords.length;
    }

    return {
      totalSymbols,
      tokenStartWordIdx,
      sentenceWordsSymbols,
      totalWordBuckets,
    };
  }
}

class MappingFactory {
  constructor(
    private readonly rand: (num: number) => number,
    private readonly symbolFact: SymbolFactory,
    private readonly options: Readonly<{
      multiTokens: boolean;
      multiInput: boolean;
    }>,
  ) {}

  public prepareMappings(
    inputWords: readonly string[],
    words: readonly string[],
    pangramsWordsList: readonly string[],
  ) {
    const tokenMap: Record<string, string> = {};
    const realMap: Record<string, string> = {};

    const {
      totalSymbols,
      tokenStartWordIdx,
      sentenceWordsSymbols,
      totalWordBuckets,
    } = this.symbolFact.buildSymbols(inputWords, words, pangramsWordsList);

    getRandomOrder(totalSymbols, this.rand);

    const totalTokens =
      this.options.multiTokens === this.options.multiInput
        ? this.buildTokens(totalSymbols)
        : this.buildSingleTokens(totalWordBuckets);

    for (let i = 0; i < totalSymbols.length; i++) {
      const tmpWordsStr = totalSymbols[i];
      if (tokenMap[tmpWordsStr]) {
        continue;
      }
      const tokensStr = totalTokens[totalTokens.length - 1 - i];
      tokenMap[tmpWordsStr] = tokensStr;
      realMap[tokensStr] = tmpWordsStr;
    }

    const tokenizedEntries: string[][] = sentenceWordsSymbols.map(
      (wordsStr) => {
        return tokenMap[wordsStr].split(spacingChars);
      },
    );

    return {
      tokenMap,
      realMap,

      tokenizedEntries,
      tokenStartWordIdx,
    };
  }

  private buildSingleTokens(totalWordBuckets: BucketType) {
    const totalSymbols = getRandomOrder(totalWordBuckets.flat(), this.rand);
    let tokens: string[] = [];
    for (let i = 0; i < totalSymbols.length; i++) {
      let symbols: SymbolType;
      if (this.options.multiTokens && this.rand(1) > 0) {
        const idx = this.rand(totalSymbols.length - 1);
        symbols = [totalSymbols[i], totalSymbols[idx]];
      } else {
        symbols = [totalSymbols[i]];
      }
      tokens.push(symbols.join(spacingChars));
    }
    return tokens;
  }

  private buildTokens(totalSymbols: string[]) {
    return getRandomOrder(totalSymbols.slice(), this.rand);
  }
}

export class PuzzleFactory {
  static New(
    level: number,
    inputWords: readonly string[],
    pangrams: readonly string[],
    seed: number,
  ) {
    validateLevel(level);
    validatePangrans(pangrams);

    const randH = seed !== undefined ? mulberry32(seed) : Math.random;
    const rand = (len: number) => Math.floor(randH() * (len + 1));

    const symbolFact = new SymbolFactory(rand, {
      chaosWords: hasFeature(level, Feature.CHAOS_WORDS),
      extraWords: hasFeature(level, Feature.EXTRA_WORDS),
      multiInput: hasFeature(level, Feature.MULTIZE_I_TOKENS),
      multiTokens: hasFeature(level, Feature.MULTIZE_TOKENS),
    });

    const mappingFact = new MappingFactory(rand, symbolFact, {
      multiInput: hasFeature(level, Feature.MULTIZE_I_TOKENS),
      multiTokens: hasFeature(level, Feature.MULTIZE_TOKENS),
    });

    return new PuzzleFactory(rand, mappingFact, level, inputWords, pangrams);
  }

  constructor(
    private readonly rand: (num: number) => number,
    private readonly mappingFact: MappingFactory,
    public readonly level: number,
    private readonly inputWords: readonly string[],
    private readonly pangrams: readonly string[],
  ) {}

  protected hasFeature(feature: Feature) {
    return hasFeature(this.level, feature);
  }

  prepare(): IPrepareResult {
    const expression = this.buildExpresion();

    let pangramsWordsList: readonly string[], words: readonly string[];

    const sentenceIdx = this.rand(this.pangrams.length - 1);
    const sentence = this.pangrams[sentenceIdx];

    if (this.hasFeature(Feature.EXTRA_WORDS)) {
      const tmpPangrams = this.pangrams.map((p) => p.split(/\s/));
      const pangramsWords = tmpPangrams.filter((_, i) => i !== sentenceIdx);
      pangramsWordsList = pangramsWords.flat();
      words = tmpPangrams[sentenceIdx];
    } else {
      words = this.pangrams[sentenceIdx].split(/\s/);
    }

    const { tokenMap, realMap, tokenizedEntries, tokenStartWordIdx } =
      this.mappingFact.prepareMappings(
        this.inputWords,
        words,
        pangramsWordsList,
      );

    const tokenizedSequenceWords: string[][] = tokenizedEntries;

    const wordsSeqs = tokenStartWordIdx.map((start, i) => {
      const next = tokenStartWordIdx[i + 1];
      const end = next ? next : words.length;
      return words.slice(start, end);
    });

    const tokenRefRemoveIdx = this.rand(tokenizedSequenceWords.length - 1);

    const correctAnswer =
      tokenizedSequenceWords[tokenRefRemoveIdx].join(spacingChars);

    const realAnswer = wordsSeqs[tokenRefRemoveIdx].join(spacingChars);

    if ([correctAnswer, realAnswer].includes(undefined)) {
      throw new Error("Mapping failure");
    }

    // insert a missing identifier
    const partialWords = [...wordsSeqs.map((v) => v.join(spacingChars))];
    partialWords[tokenRefRemoveIdx] = blankWordToken;

    // insert missing tokenized part
    const symbolExpression = this.buildSymbolExpression();
    const partialTokenizedWords = [...tokenizedSequenceWords].map(
      symbolExpression.mapper,
    );
    const isPartialReason = this.hasFeature(Feature.PARTIAL_REASINING);
    const activePartial = [...partialTokenizedWords[tokenRefRemoveIdx]];
    if (isPartialReason && activePartial.length !== 1 && this.rand(1) > 0) {
      activePartial[0] = blankWordToken;
      partialTokenizedWords[tokenRefRemoveIdx] = activePartial;
    } else {
      // TODO: hide half a word
      partialTokenizedWords[tokenRefRemoveIdx] = [blankWordToken];
    }

    const seperator = this.hasFeature(Feature.EXCLUDE_SENTENCE_SPACES)
      ? ""
      : " ";

    const binarySeperator = ["binary", "binaryrot"].includes(
      symbolExpression.options.type,
    )
      ? " "
      : seperator;

    const partialTokenizedSentence = partialTokenizedWords
      .map((w) => w.join(binarySeperator))
      .join(binarySeperator);

    const tokenizedSentence = tokenizedSequenceWords
      .map((w) => w.join(seperator))
      .join(seperator);

    const testComplex = {
      identLocationOrder: this.rand(1),
      identLocationType: this.rand(1),
      puzzleType: this.hasFeature(Feature.MAPPING_INFO_PUZZLE)
        ? this.rand(1) > 0
          ? ("reverse" as const)
          : ("order" as const)
        : (false as const),
      rand: this.rand,
    };

    const res = {
      realMap,
      tokenMap,

      tokenizedWords: tokenizedSequenceWords,
      tokenizedSentence,
      partialTokenizedSentence,
      partialTokenizedWords,

      sentence: sentence,

      sentenceWords: words,
      partialWords,
      wordsSeqs,

      correctAnswer,
      realAnswer,

      expression,
      symbolExpression,
      testComplex,
    };

    return res;
  }

  protected buildSymbolExpression(): SymbolExpression<SymbolTypeOptions> {
    if (!this.hasFeature(Feature.INDIRECT_SYMBOLS)) {
      return createSymbolExpression({
        mapper: (w) => w,
        options: { type: "none" },
      });
    }
    const type = this.rand(2);
    switch (type) {
      case 0: {
        const shift = this.rand(24) + 1;
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => rotN(wIn, shift)),
          options: {
            type: "rot",
            rotNNum: shift,
          },
        });
      }
      case 1: {
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => toBinary(wIn)),
          options: { type: "binary" },
        });
      }
      case 2: {
        const shift = this.rand(24) + 1;
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => toBinary(rotN(wIn, shift))),
          options: {
            type: "binaryrot",
            rotNNum: shift,
          },
        });
      }
    }
  }

  protected buildExpresion(): IExpressionResult {
    const equalSymbol = equalSymblsSet[this.rand(equalSymblsSet.length - 1)];
    const expressionDefinition = getRandomOrder(
      [
        ExpressionPart.OLD_OPARAND,
        ExpressionPart.OPERATOR,
        ExpressionPart.NEW_OPARAND,
      ] as ExpressionDefinitionType,
      this.rand,
    );
    const idx = expressionDefinition.indexOf(ExpressionPart.OPERATOR);
    const expressionType =
      idx === 0 ? "prefix" : idx === 1 ? "infix" : "postfix";
    return {
      expressionDefinition: expressionDefinition,
      expressionType,
      equalSymbol,
    };
  }
}

export function createSymbolExpression<T extends SymbolTypeOptions>(
  expr: SymbolExpression<T>,
): SymbolExpression<T> {
  return expr;
}

const validateLevel = (i: number) => {
  if (!(i >= 0 && i <= levelMax)) {
    throw new TypeError("Invalid level");
  }
};

const validatePangrans = (list: readonly string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("Invalid pangram list");
  }
};

const validateSeed = (num: number) => {
  if (!(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  }
};
