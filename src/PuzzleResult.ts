import {
  blankWordToken,
  extraWords,
  capitalizeFirstLetter,
  rotN,
  toBinary,
  equalSymblsSet,
  reverseFirstLetter,
  spacingChars,
  pangramsDefault,
} from "./characters";
import {
  IPrepareResult,
  SymbolExpression,
  SymbolTypeOptions,
  IExpressionResult,
  ExpressionPart,
  ExpressionDefinitionType,
  ISymbols,
  SymbolRaw,
} from "./interface";
import { hasFeature, Feature, levelMax } from "./levels";
import { mulberry32, getRandomOrder, pickRandomBucket } from "./random";

interface SymbolMapper<T extends SymbolTypeOptions>
  extends SymbolExpression<T> {
  mapper: (w: SymbolRaw) => SymbolRaw;
}

let pangramsDefaultCache: readonly (readonly string[])[] | undefined =
  undefined;

type BucketType = readonly (readonly string[])[];

interface PuzzleContext {
  /** The chosen pangram */
  chosen: readonly string[];

  /** items used when reading symbols */
  active?: readonly string[];

  /** all - pangrams - chaose words - extrawords */
  otherWords: readonly string[];

  /** list of wordlists */
  totalWordsBuckets: BucketType;
  /** The total length of all words */
  totallen: number;

  /** all - words */
  otherWordsBuckets: BucketType;

  /** The smallest pangrams length */
  minCount: number;
}

class RandomSource {
  constructor(private readonly _rand: (num: number) => number) {}

  bool() {
    return Boolean(this._rand(1));
  }

  rand = (num: number) => {
    return this._rand(num);
  };

  randOrder<T>(input: T[]) {
    return getRandomOrder(input, this._rand);
  }
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
      for (let elm of extraWords) {
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

class SymbolObj implements ISymbols {
  public readonly str: string;
  constructor(public readonly els: SymbolRaw) {
    this.str = els.join(spacingChars);
  }
}

class SymbolFactory {
  constructor(
    private readonly randSource: RandomSource,
    private readonly options: Readonly<{
      multiTokens: boolean;
      multiInput: boolean;
    }>,
  ) {}

  public buildTokens(totalSymbols: ISymbols[], totalWordBuckets: BucketType) {
    if (this.options.multiTokens === this.options.multiInput) {
      return this.randSource.randOrder(totalSymbols.slice());
    }

    const totalWords = this.randSource.randOrder(totalWordBuckets.flat());
    let tokens: ISymbols[] = [];
    for (let i = 0; i < totalWords.length; i++) {
      let symbols: SymbolRaw;
      if (this.options.multiTokens && this.randSource.bool()) {
        const idx = this.randSource.rand(totalWords.length - 1);
        symbols = [totalWords[i], totalWords[idx]];
      } else {
        symbols = [totalWords[i]];
      }
      tokens.push(new SymbolObj(symbols));
    }
    return tokens;
  }

  public buildSymbols(context: PuzzleContext) {
    const totalSymbols: ISymbols[] = [];

    context.otherWordsBuckets.forEach((bucket) =>
      this.buildWords(bucket, context, totalSymbols),
    );

    const sentenceWordsSymbols: ISymbols[] = [];
    const wordsSeqs: ISymbols[] = [];
    for (let npwi = 0; npwi < context.chosen.length; npwi++) {
      const tmpWords = this.readWords(npwi, context.chosen);
      const nextWord = context.chosen[npwi + tmpWords.els.length];
      const symbols = this.findSymbols(tmpWords, nextWord, context);

      wordsSeqs.push(tmpWords);
      totalSymbols.push(...symbols);
      sentenceWordsSymbols.push(symbols[0]);

      npwi += tmpWords.els.length - 1;
    }

    return {
      totalSymbols,
      wordsSeqs,
      sentenceWordsSymbols,
    };
  }

  private buildWords(
    arr: readonly string[],
    context: PuzzleContext,
    totalSymbols: ISymbols[],
  ) {
    for (let i = 0; i < arr.length; i++) {
      const words = this.readWords(i, arr);
      const nextWord: string | undefined = arr[i + words.els.length];

      totalSymbols.push(...this.findSymbols(words, nextWord, context));

      i += words.els.length - 1;
    }
  }

  private readWords(idx: number, array: readonly string[]): ISymbols {
    const multiWordRoll =
      this.options.multiInput && this.randSource.bool()
        ? idx !== array.length - 1
        : false;
    return new SymbolObj(
      multiWordRoll ? [array[idx], array[idx + 1]] : [array[idx]],
    );
  }

  private pickMissingSymbol(
    words: ISymbols,
    nextWord: undefined | string,
    context: PuzzleContext,
  ): ISymbols[] {
    if (words.els.length === 2) {
      const candidates: [SymbolRaw, SymbolRaw] = [
        [words.els[0]],
        [words.els[1]],
      ];
      return this.randSource.bool()
        ? candidates.map((v) => new SymbolObj(v))
        : candidates
            .splice(this.randSource.rand(1), 1)
            .map((v) => new SymbolObj(v));
    }

    const [bucketIdx, bucket] = this.pickRandomBucket(
      context.totalWordsBuckets,
      context.totallen,
    );

    const idx =
      bucket[bucketIdx] === nextWord
        ? (bucketIdx + 1) % bucket.length
        : bucketIdx;

    return ([[words.els[0], bucket[idx]]] as SymbolRaw[]).map(
      (v: SymbolRaw) => new SymbolObj(v),
    );
  }

  private pickRandomBucket(totalWordsBuckets: BucketType, len: number) {
    return pickRandomBucket(totalWordsBuckets, len, this.randSource.rand);
  }

  private findSymbols(
    words: ISymbols,
    nextWord: string,
    context: PuzzleContext,
  ) {
    if (this.options.multiTokens && this.options.multiInput) {
      return [words, ...this.pickMissingSymbol(words, nextWord, context)];
    }
    return [words];
  }
}

class MappingFactory {
  constructor(
    private readonly randSource: RandomSource,
    private readonly symbolFact: SymbolFactory,
  ) {}

  public prepareMappings(context: PuzzleContext) {
    const tokenMap: Record<string, ISymbols> = {};
    const realMap: Record<string, ISymbols> = {};

    // TODO: missing words when multiI level?
    const { totalSymbols, wordsSeqs, sentenceWordsSymbols } =
      this.symbolFact.buildSymbols(context);

    this.getRandomOrder(totalSymbols);

    const totalTokens = this.symbolFact.buildTokens(
      totalSymbols,
      context.totalWordsBuckets,
    );

    for (let i = 0; i < totalSymbols.length; i++) {
      const symbolObj = totalSymbols[i];
      if (tokenMap[symbolObj.str]) {
        continue;
      }
      const tokenObj = totalTokens[totalTokens.length - 1 - i];

      tokenMap[symbolObj.str] = tokenObj;
      realMap[tokenObj.str] = symbolObj;
    }

    const tokenizedEntries: ISymbols[] = sentenceWordsSymbols.map((words) => {
      return tokenMap[words.str];
    });

    return {
      tokenMap,
      realMap,

      tokenizedEntries,
      wordsSeqs,
    };
  }

  private getRandomOrder<T>(arr: T[]) {
    return getRandomOrder(arr, this.randSource.rand);
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

  const randomSource = new RandomSource(rand);

  const otherWordsFact = new OtherWordsFactory({
    extraWords: hasFeature(level, Feature.EXTRA_WORDS),
    chaosWords: hasFeature(level, Feature.CHAOS_WORDS),
  });

  const symbolFact = new SymbolFactory(randomSource, {
    multiInput: hasFeature(level, Feature.MULTIZE_I_TOKENS),
    multiTokens: hasFeature(level, Feature.MULTIZE_TOKENS),
  });

  const mappingFact = new MappingFactory(randomSource, symbolFact);

  return new PuzzleService(
    randomSource,
    mappingFact,
    otherWordsFact,
    level,
    pangrams,
    inputWords,
  );
}

export class PuzzleService {
  constructor(
    private readonly randSource: RandomSource,
    private readonly mappingFact: MappingFactory,
    private readonly otherWordsFact: OtherWordsFactory,
    public readonly level: number,
    private readonly pangrams: readonly string[],
    private readonly inputWords: readonly string[],
  ) {}

  private hasFeature(feature: Feature) {
    return hasFeature(this.level, feature);
  }

  prepare(): IPrepareResult {
    const context = this.createContext();

    const { tokenMap, realMap, tokenizedEntries, wordsSeqs } =
      this.mappingFact.prepareMappings(context);

    const tokenizedSequenceWords: ISymbols[] = tokenizedEntries;

    const totalPosition = this.randSource.rand(
      tokenizedSequenceWords.length - 1,
    );

    const tokenRefRemoveIdx =
      this.randSource.rand(2) > 0
        ? Math.min(totalPosition, this.randSource.rand(context.minCount - 1))
        : totalPosition;

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].str;

    const realAnswer = wordsSeqs[tokenRefRemoveIdx].str;

    if ([correctAnswer as any, realAnswer as any].includes(undefined)) {
      throw new Error("Mapping failure");
    }

    // insert a missing identifier
    const partialWords = [...wordsSeqs.map((v) => v.str)];
    partialWords[tokenRefRemoveIdx] = blankWordToken;

    // insert missing tokenized part
    const symbolExpression = this.buildSymbolMapper();
    const partialTokenizedWords = [...tokenizedSequenceWords]
      .map((obj) => obj.els)
      .map(symbolExpression.mapper);

    const isPartialReason = this.hasFeature(Feature.PARTIAL_REASINING);
    const activePartial: [string] | [string, string] = [
      ...partialTokenizedWords[tokenRefRemoveIdx],
    ];
    if (
      isPartialReason &&
      activePartial.length !== 1 &&
      this.randSource.bool()
    ) {
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
      .map((w) => w.str)
      .join(seperator);

    const testComplex = {
      identLocationOrder: this.randSource.rand(1),
      identLocationType: this.randSource.rand(1),
      puzzleType: this.hasFeature(Feature.MAPPING_INFO_PUZZLE)
        ? this.randSource.bool()
          ? ("reverse" as const)
          : ("order" as const)
        : (false as const),
      rand: this.randSource.rand,
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

  private createContext() {
    const { words, pangramsWordsList, minCount } = this.prepareActivePangram(
      this.pangrams,
    );

    const otherWords = Array.from(
      this.otherWordsFact.build(this.inputWords, pangramsWordsList, words),
    );

    const active = pangramsWordsList;

    const otherWordsBuckets = [otherWords, active].filter((v) => v !== void 0);

    const totalWordsBuckets = [...otherWordsBuckets, words];
    const len = totalWordsBuckets.reduce((sum, arr) => sum + arr.length, 0);
    const context: PuzzleContext = {
      chosen: words,
      active: pangramsWordsList,
      otherWords,
      totalWordsBuckets,
      totallen: len,
      otherWordsBuckets,
      minCount,
    };

    return context;
  }

  private prepareActivePangram(pangrams: readonly string[]) {
    const sentenceIdx = this.randSource.rand(pangrams.length - 1);

    let pangramsWordsList: readonly string[] | undefined;
    let words: readonly string[];

    let tmpPangrams: readonly (readonly string[])[];
    const usingDefault = pangrams === pangramsDefault;

    if (!usingDefault) {
      tmpPangrams = pangrams.map((p) => p.split(/\s/));
    } else if (usingDefault && pangramsDefaultCache === undefined) {
      tmpPangrams = pangramsDefaultCache = pangramsDefault.map((p) =>
        p.split(/\s/),
      );
    } else if (usingDefault && pangramsDefaultCache !== undefined) {
      tmpPangrams = pangramsDefaultCache;
    } else {
      throw new Error();
    }

    const minCount = Math.min(...tmpPangrams.map((v) => v.length));

    if (this.hasFeature(Feature.EXTRA_WORDS)) {
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

  private buildSymbolMapper(): SymbolMapper<SymbolTypeOptions> {
    type MappedSymbol = [string] | [string, string];
    if (!this.hasFeature(Feature.INDIRECT_SYMBOLS)) {
      return createSymbolExpression({
        mapper: (w) => w,
        options: { type: "none" },
      });
    }
    const type = this.randSource.rand(2);
    switch (type) {
      case 0: {
        const shift = this.randSource.rand(24) + 1;
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => rotN(wIn, shift)) as MappedSymbol,
          options: {
            type: "rot",
            rotNNum: shift,
          },
        });
      }
      case 1: {
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => toBinary(wIn)) as MappedSymbol,
          options: { type: "binary" },
        });
      }
      case 2: {
        const shift = this.randSource.rand(24) + 1;
        return createSymbolExpression({
          mapper: (w) =>
            w.map((wIn) => toBinary(rotN(wIn, shift))) as MappedSymbol,
          options: {
            type: "binaryrot",
            rotNNum: shift,
          },
        });
      }
    }

    throw new Error("Should never reach here");
  }

  private buildExpresion(): IExpressionResult {
    const equalSymbol =
      equalSymblsSet[this.randSource.rand(equalSymblsSet.length - 1)];
    const expressionDefinition = getRandomOrder(
      [
        ExpressionPart.OLD_OPARAND,
        ExpressionPart.OPERATOR,
        ExpressionPart.NEW_OPARAND,
      ] as ExpressionDefinitionType,
      this.randSource.rand,
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
  expr: SymbolMapper<T>,
): SymbolMapper<T> {
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
