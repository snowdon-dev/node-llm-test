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

interface PuzzleContext {
  chosen: readonly string[];
  active?: readonly string[];
  otherWords: ReadonlySet<string>;
  totalWordsBuckets: BucketType;
  otherWordsBuckets: BucketType;
}

class OtherWordsFactory {
  constructor(
    private readonly options: Readonly<{
      chaosWords: boolean;
      extraWords: boolean;
    }>,
  ) {}

  public build(
    input: readonly string[],
    pangramsWordsList: readonly string[] | undefined,
    words: readonly string[],
  ) {
    const activeBuckets = [words, pangramsWordsList].filter(
      (v) => v !== void 0,
    );
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
      for (let elm of chaosWords) {
        const lower = elm.toLowerCase();
        if (!excludeWordsSet.has(lower)) {
          otherWords.add(lower);
        }
        if (this.options.chaosWords) {
          const upper = capitalizeFirstLetter(lower);
          if (!excludeWordsSet.has(upper)) {
            otherWords.add(upper);
          }
        }
      }
    }

    if (this.options.chaosWords && pangramsWordsList) {
      for (let i = 0; i < pangramsWordsList.length; i++) {
        const word = reverseFirstLetter(pangramsWordsList[i]);
        if (!excludeWordsSet.has(word)) {
          otherWords.add(word);
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

    return otherWords as ReadonlySet<string>;
  }
}

class SymbolFactory {
  constructor(
    private readonly rand: (num: number) => number,
    private readonly options: Readonly<{
      multiTokens: boolean;
      multiInput: boolean;
    }>,
  ) {}

  public buildTokens(totalSymbols: string[], totalWordBuckets: BucketType) {
    if (this.options.multiTokens === this.options.multiInput) {
      return getRandomOrder(totalSymbols.slice(), this.rand);
    }

    const totalWords = getRandomOrder(totalWordBuckets.flat(), this.rand);
    let tokens: string[] = [];
    for (let i = 0; i < totalWords.length; i++) {
      let symbols: SymbolType;
      if (this.options.multiTokens && this.rand(1) > 0) {
        const idx = this.rand(totalWords.length - 1);
        symbols = [totalWords[i], totalWords[idx]];
      } else {
        symbols = [totalWords[i]];
      }
      tokens.push(symbols.join(spacingChars));
    }
    return tokens;
  }

  public buildSymbols(context: PuzzleContext) {
    const totalSymbols: string[] = [];

    context.otherWordsBuckets.forEach((bucket) =>
      this.buildWords(bucket, context.totalWordsBuckets, totalSymbols),
    );

    const tokenStartWordIdx: number[] = [];
    const sentenceWordsSymbols: string[] = [];
    let wordIdx = 0;
    for (let npwi = 0; npwi < context.chosen.length; npwi++) {
      const tmpWords = this.readWords(npwi, context.chosen);
      const symbolStrs = this.findSymbols(tmpWords, context.totalWordsBuckets);

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
    };
  }

  private readWords(idx: number, array: readonly string[]): SymbolType {
    const multiWordRoll =
      this.options.multiInput && this.rand(1) > 0
        ? idx !== array.length - 1
        : false;
    return multiWordRoll ? [array[idx], array[idx + 1]] : [array[idx]];
  }

  private pickMissingSymbol(words: SymbolType, totalWordsBuckets: BucketType) {
    if (words.length === 2) {
      return [[words[0]], [words[1]]];
    }

    const len = totalWordsBuckets.reduce((sum, arr) => sum + arr.length, 0);
    const [idx, bucket] = pickRandomBucket(totalWordsBuckets, len, this.rand);

    return [[words[0], bucket[idx]]];
  }

  private findSymbols(words: SymbolType, totalWordBuckets: BucketType) {
    if (this.options.multiTokens && this.options.multiInput) {
      return [words, ...this.pickMissingSymbol(words, totalWordBuckets)].map(
        (s) => s.join(spacingChars),
      );
    }
    return [words.join(spacingChars)];
  }

  private buildWords(
    arr: readonly string[],
    totalWordBuckets: BucketType,
    totalSymbols: string[],
  ) {
    for (let i = 0; i < arr.length; i++) {
      const words = this.readWords(i, arr);
      totalSymbols.push(...this.findSymbols(words, totalWordBuckets));
      i += words.length - 1;
    }
  }
}

class MappingFactory {
  constructor(
    private readonly rand: (num: number) => number,
    private readonly symbolFact: SymbolFactory,
  ) {}

  public prepareMappings(context: PuzzleContext) {
    const tokenMap: Record<string, string> = {};
    const realMap: Record<string, string> = {};

    // TODO: missing words when some multiI level?
    // TODO: missing words balance on both sides multi
    const { totalSymbols, tokenStartWordIdx, sentenceWordsSymbols } =
      this.symbolFact.buildSymbols(context);

    this.getRandomOrder(totalSymbols);

    const totalTokens = this.symbolFact.buildTokens(
      totalSymbols,
      context.totalWordsBuckets,
    );

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

    const wordsSeqs = tokenStartWordIdx.map((start, i) => {
      const next = tokenStartWordIdx[i + 1];
      const end = next ? next : context.chosen.length;
      return context.chosen.slice(start, end);
    });

    return {
      tokenMap,
      realMap,

      tokenizedEntries,
      wordsSeqs,
    };
  }

  private getRandomOrder<T>(arr: T[]) {
    return getRandomOrder(arr, this.rand);
  }
}

export function makePuzzleService(
  level: number,
  inputWords: readonly string[],
  pangrams: readonly string[],
  seed: number,
) {
  validateLevel(level);
  validatePangrams(pangrams);
  validateSeed(seed);

  const randH = seed !== undefined ? mulberry32(seed) : Math.random;
  const rand = (len: number) => Math.floor(randH() * (len + 1));

  const otherWordsFact = new OtherWordsFactory({
    extraWords: hasFeature(level, Feature.EXTRA_WORDS),
    chaosWords: hasFeature(level, Feature.CHAOS_WORDS),
  });

  const symbolFact = new SymbolFactory(rand, {
    multiInput: hasFeature(level, Feature.MULTIZE_I_TOKENS),
    multiTokens: hasFeature(level, Feature.MULTIZE_TOKENS),
  });

  const mappingFact = new MappingFactory(rand, symbolFact);

  return new PuzzleService(
    rand,
    mappingFact,
    otherWordsFact,
    level,
    pangrams,
    inputWords,
  );
}

export class PuzzleService {
  constructor(
    private readonly rand: (num: number) => number,
    private readonly mappingFact: MappingFactory,
    private readonly otherWordsFact: OtherWordsFactory,
    public readonly level: number,
    private readonly pangrams: readonly string[],
    private readonly inputWords: readonly string[],
  ) {}

  protected hasFeature(feature: Feature) {
    return hasFeature(this.level, feature);
  }

  prepare(): IPrepareResult {
    const context = this.createContext();

    const { tokenMap, realMap, tokenizedEntries, wordsSeqs } =
      this.mappingFact.prepareMappings(context);

    const tokenizedSequenceWords: string[][] = tokenizedEntries;

    // TODO: tune position to min(panagrams) length?
    const tokenRefRemoveIdx = this.rand(tokenizedSequenceWords.length - 1);

    const correctAnswer =
      tokenizedSequenceWords[tokenRefRemoveIdx].join(spacingChars);

    const realAnswer = wordsSeqs[tokenRefRemoveIdx].join(spacingChars);

    if ([correctAnswer as any, realAnswer as any].includes(undefined)) {
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

    const expression = this.buildExpresion();

    const res = {
      realMap,
      tokenMap,

      tokenizedWords: tokenizedSequenceWords,
      tokenizedSentence,
      partialTokenizedSentence,
      partialTokenizedWords,

      sentence: context.chosen.join(" "),

      sentenceWords: context.chosen,
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

  protected createContext() {
    const { words, pangramsWordsList } = this.prepareActivePangram(
      this.pangrams,
    );

    const otherWords = this.otherWordsFact.build(
      this.inputWords,
      pangramsWordsList,
      words,
    );

    const active = pangramsWordsList;

    const otherWordsBuckets = [Array.from(otherWords), active].filter(
      (v) => v !== void 0,
    );

    const totalWordsBuckets = [...otherWordsBuckets, words];

    const context: PuzzleContext = {
      chosen: words,
      active: pangramsWordsList,
      otherWords,
      totalWordsBuckets,
      otherWordsBuckets,
    };

    return context;
  }

  private prepareActivePangram(pangrams: readonly string[]) {
    const sentenceIdx = this.rand(pangrams.length - 1);

    let pangramsWordsList: readonly string[] | undefined;
    let words: readonly string[];

    if (this.hasFeature(Feature.EXTRA_WORDS)) {
      const tmpPangrams = pangrams.map((p) => p.split(/\s/));
      const pangramsWords = tmpPangrams.filter((_, i) => i !== sentenceIdx);
      pangramsWordsList = pangramsWords.flat();
      words = tmpPangrams[sentenceIdx];
    } else {
      pangramsWordsList = undefined;
      words = pangrams[sentenceIdx].split(/\s/);
    }

    return { words, pangramsWordsList };
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

    throw new Error("Should never reach here");
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

const validatePangrams = (list: readonly string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("Invalid pangram list");
  }
};

const validateSeed = (num: number) => {
  if (!(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  }
};
