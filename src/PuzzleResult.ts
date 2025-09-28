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
import { getRandomOrder, RandomSource } from "./random";

interface SymbolMapper<T extends SymbolTypeOptions>
  extends SymbolExpression<T> {
  mapper: (w: SymbolRaw) => SymbolRaw;
}

let pangramsDefaultCache: readonly (readonly string[])[] | undefined =
  undefined;

export type BucketType = readonly (readonly string[])[];

export interface PuzzleContext {
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

  /** The smallest pangrams length */
  minCount: number;
}
type ReadWordFn = (idx: number, array: readonly string[]) => SymbolObj;

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

export class SymbolObj implements ISymbols {
  public readonly str: string;
  constructor(public readonly els: SymbolRaw) {
    this.str = els.join(spacingChars);
  }
}

export class SymbolFactory {
  private readonly used: Set<string>;
  private readonly findSymbols: (
    words: ISymbols,
    nextWord: string,
    context: PuzzleContext,
  ) => ISymbols[];
  private readonly buildTokens: (
    totalSymbols: ISymbols[],
    context: PuzzleContext,
  ) => ISymbols[];
  private readonly readWords: (
    idx: number,
    array: readonly string[],
  ) => SymbolObj;

  constructor(
    private readonly random: RandomSource,
    private readonly options: Readonly<{
      multiTokens: boolean;
      multiInput: boolean;
    }>,
  ) {
    this.used = new Set<string>();
    this.findSymbols = this.makeFind();
    this.buildTokens = this.makeBuildTokens();
    this.readWords = this.buildReadWords();
  }

  private makeFind() {
    return this.options.multiTokens && this.options.multiInput
      ? this.findWithSymbols
      : this.findNull;
  }

  private findWithSymbols(
    words: ISymbols,
    nextWord: string,
    context: PuzzleContext,
  ) {
    return [words, ...this.pickMissingSymbol(words, nextWord, context)];
  }

  private findNull(words: ISymbols, _: string, __: PuzzleContext) {
    return [words];
  }

  private makeBuildTokens() {
    return this.options.multiTokens === this.options.multiInput
      ? this.buildTotalTokens
      : this.buildFlatTokens;
  }

  buildTotalTokens(totalSymbols: ISymbols[], _: PuzzleContext) {
    return this.random.randOrder(totalSymbols);
  }

  private buildFlatTokens = (_: ISymbols[], context: PuzzleContext) => {
    const total = Array.from(
      new Set([...(context.active ?? []), ...context.chosen]),
    ).concat(context.otherWords);
    const totalWords = this.random.randOrder(total);
    let tokens: ISymbols[] = [];

    for (let i = 0; i < totalWords.length; i++) {
      let symbols: SymbolRaw;
      if (this.options.multiTokens && this.random.bool()) {
        const idx = this.random.rand(totalWords.length - 1);
        symbols = [totalWords[i], totalWords[idx]];
      } else {
        symbols = [totalWords[i]];
      }
      tokens.push(new SymbolObj(symbols));
    }
    return tokens;
  };

  private buildReadWords(): ReadWordFn {
    return this.options.multiInput ? this.readMultiWords : this.readSingleWord;
  }

  private readMultiWords(idx: number, array: string[]) {
    return new SymbolObj(
      this.random.bool() && idx !== array.length - 1
        ? [array[idx], array[idx + 1]]
        : [array[idx]],
    );
  }

  private readSingleWord(idx: number, array: string[]) {
    return new SymbolObj([array[idx]]);
  }

  public buildSymbols(context: PuzzleContext) {
    const totalSymbols: ISymbols[] = [];

    this.buildWords(context.otherWords, context, totalSymbols);
    if (context.active !== undefined) {
      this.buildWords(context.active, context, totalSymbols, true);
    }

    const sentenceWordsSymbols: ISymbols[] = [];
    const wordsSeqs: ISymbols[] = [];
    for (let npwi = 0; npwi < context.chosen.length; npwi++) {
      const tmpWords = this.readWords(npwi, context.chosen);
      const nextWord = context.chosen[npwi + tmpWords.els.length];

      wordsSeqs.push(tmpWords);
      sentenceWordsSymbols.push(tmpWords);
      npwi += tmpWords.els.length - 1;

      if (this.used.has(tmpWords.str)) continue;

      const symbols = this.findSymbols(tmpWords, nextWord, context);

      for (let k = 0; k < symbols.length; k++) {
        this.used.add(symbols[k].str);
        totalSymbols.push(symbols[k]);
      }
    }

    const tokens = this.buildTokens(totalSymbols, context);
    this.random.randOrder(totalSymbols);

    return {
      totalSymbols,
      tokens,

      wordsSeqs,
      sentenceWordsSymbols,
    };
  }

  private buildWords(
    arr: readonly string[],
    context: PuzzleContext,
    totalSymbols: ISymbols[],
    removeDupes: boolean = false,
  ) {
    for (let i = 0; i < arr.length; i++) {
      const words = this.readWords(i, arr);
      const nextWord: string | undefined = arr[i + words.els.length];
      const symbols = this.findSymbols(words, nextWord, context);

      i += words.els.length - 1;

      if (removeDupes && this.used.has(words.str)) continue;

      for (let k = 0; k < symbols.length; k++) {
        this.used.add(symbols[k].str);
        totalSymbols.push(symbols[k]);
      }
    }
  }

  private pickMissingSymbol(
    words: ISymbols,
    nextWord: undefined | string,
    context: PuzzleContext,
  ): ISymbols[] {
    if (words.els.length === 2) {
      let candidates: string[] = [];
      for (const word of words.els) {
        if (!this.used.has(word)) candidates.push(word);
      }
      if (candidates.length === 0) {
        return [];
      }
      return [new SymbolObj([words.els[this.random.rand(1)]])];
    }

    const [bucketIdx, bucket] = this.pickRandomBucket(
      context.totalWordsBuckets,
      context.totallen,
    );

    const idx =
      bucket[bucketIdx] === nextWord
        ? (bucketIdx + 1) % bucket.length
        : bucketIdx;

    return [new SymbolObj([words.els[0], bucket[idx]])];
  }

  private pickRandomBucket(
    totalWordsBuckets: BucketType,
    len: number,
  ): [number, readonly string[]] {
    let randIndex = this.random.rand(len - 1);

    const arr0 = totalWordsBuckets[0];
    if (randIndex < arr0.length) return [randIndex, arr0];
    randIndex -= arr0.length;

    if (totalWordsBuckets.length > 1) {
      const arr1 = totalWordsBuckets[1];
      if (randIndex < arr1.length) return [randIndex, arr1];
      randIndex -= arr1.length;
    }

    if (totalWordsBuckets.length > 2) {
      const arr2 = totalWordsBuckets[2];
      if (randIndex < arr2.length) return [randIndex, arr2];
    }
    throw new Error();
  }
}

export class MappingFactory {
  public prepareMappings(context: ReturnType<SymbolFactory["buildSymbols"]>) {
    const tokenMap: Record<string, ISymbols> = Object.create(null);
    const realMap: Record<string, ISymbols> = Object.create(null);

    const { totalSymbols, wordsSeqs, sentenceWordsSymbols } = context;

    const totalTokens = context.tokens;

    for (let i = 0; i < totalSymbols.length; i++) {
      const symbolObj = totalSymbols[i];
      const tokenObj = totalTokens[totalTokens.length - 1 - i];

      tokenMap[symbolObj.str] = tokenObj;
      realMap[tokenObj.str] = symbolObj;
    }

    const tokenizedEntries: ISymbols[] = [];
    for (const word of sentenceWordsSymbols) {
      tokenizedEntries.push(tokenMap[word.str]);
    }

    return {
      tokenMap,
      realMap,

      tokenizedEntries,
      wordsSeqs,
    };
  }
}

function mappingProvider(symbols: SymbolFactory, mapping: MappingFactory) {
  return function (context: PuzzleContext) {
    const symResult = symbols.buildSymbols(context);
    return mapping.prepareMappings(symResult);
  };
}

export function makePuzzleService(
  level: number,
  inputWords: readonly string[],
  pangrams: readonly string[],
  seed?: number,
) {
  validateLevel(level);
  validatePangrams(pangrams);
  validateSeed(seed);

  const randomSource = RandomSource.New(
    seed !== undefined ? RandomSource.TYPES[0] : RandomSource.TYPES[1],
    seed,
  );

  const otherWordsFact = new OtherWordsFactory({
    extraWords: hasFeature(level, Feature.EXTRA_WORDS),
    chaosWords: hasFeature(level, Feature.CHAOS_WORDS),
  });

  const symbolFact = new SymbolFactory(randomSource, {
    multiInput: hasFeature(level, Feature.MULTIZE_I_TOKENS),
    multiTokens: hasFeature(level, Feature.MULTIZE_TOKENS),
  });

  const mappingFact = new MappingFactory();

  const mappings = mappingProvider(symbolFact, mappingFact);
  return new PuzzleService(
    randomSource,
    mappings,
    otherWordsFact,
    level,
    pangrams,
    inputWords,
  );
}

export class PuzzleService {
  constructor(
    private readonly random: RandomSource,
    private readonly mappings: ReturnType<typeof mappingProvider>,
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
      this.mappings(context);

    const tokenizedSequenceWords: ISymbols[] = tokenizedEntries;

    const totalPosition = this.random.rand(
      tokenizedSequenceWords.length - 1,
    );

    const minIndex = context.minCount - 1;
    const tokenRefRemoveIdx =
      totalPosition > minIndex && this.random.rand(2) > 0
        ? this.random.rand(minIndex)
        : totalPosition;

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].str;
    const realAnswer = wordsSeqs[tokenRefRemoveIdx].str;

    const symbolExpression = this.buildSymbolMapper();

    // insert a missing identifier
    const partialWords = [...wordsSeqs.map((v) => v.str)];
    partialWords[tokenRefRemoveIdx] = blankWordToken;

    // insert missing tokenized part
    const partialTokenizedWords: SymbolRaw[] = [];
    for (const obj of tokenizedSequenceWords) {
      partialTokenizedWords.push(symbolExpression.mapper(obj.els));
    }
    const isPartialReason = this.hasFeature(Feature.PARTIAL_REASINING);
    const activePartial: [string] | [string, string] = [
      ...partialTokenizedWords[tokenRefRemoveIdx],
    ];
    if (
      isPartialReason &&
      activePartial.length !== 1 &&
      this.random.bool()
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

    let partialTokenizedSentence = "";
    for (let i = 0; i < partialTokenizedWords.length; i++) {
      const arr = partialTokenizedWords[i];
      for (let j = 0; j < arr.length; j++) {
        if (partialTokenizedSentence)
          partialTokenizedSentence += binarySeperator;
        partialTokenizedSentence += arr[j];
      }
    }

    let tokenizedSentence = "";
    for (let i = 0; i < tokenizedSequenceWords.length; i++) {
      if (i > 0) tokenizedSentence += seperator;
      tokenizedSentence += tokenizedSequenceWords[i].str;
    }

    const testComplex = {
      identLocationOrder: this.random.rand(1),
      identLocationType: this.random.rand(1),
      puzzleType: this.hasFeature(Feature.MAPPING_INFO_PUZZLE)
        ? this.random.bool()
          ? ("reverse" as const)
          : ("order" as const)
        : (false as const),
      rand: this.random.rand,
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

    const otherSet = this.otherWordsFact.build(
      this.inputWords,
      pangramsWordsList,
      words,
    );
    const otherWords = Array.from(otherSet);

    const active = pangramsWordsList;

    const totalWordsBuckets = [
      ...[otherWords, active].filter((v) => v !== void 0),
      words,
    ];
    const len = totalWordsBuckets.reduce((sum, arr) => sum + arr.length, 0);
    const context: PuzzleContext = {
      chosen: words,
      active: pangramsWordsList,
      otherWords,
      totalWordsBuckets,
      totallen: len,
      minCount,
    };

    return context;
  }

  private prepareActivePangram(pangrams: readonly string[]) {
    const sentenceIdx = this.random.rand(pangrams.length - 1);

    let pangramsWordsList: readonly string[] | undefined;
    let words: readonly string[];

    let tmpPangrams: readonly (readonly string[])[];
    const usingDefault = pangrams === pangramsDefault;

    if (!usingDefault) {
      tmpPangrams = pangrams.map((p) => p.split(/\s/));
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
    const type = this.random.rand(2);
    switch (type) {
      case 0: {
        const shift = this.random.rand(24) + 1;
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
        const shift = this.random.rand(24) + 1;
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
      equalSymblsSet[this.random.rand(equalSymblsSet.length - 1)];
    const expressionDefinition = getRandomOrder(
      [
        ExpressionPart.OLD_OPARAND,
        ExpressionPart.OPERATOR,
        ExpressionPart.NEW_OPARAND,
      ] as ExpressionDefinitionType,
      this.random.rand,
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

const validateSeed = (num?: number) => {
  const isNum = typeof num === "number";
  if (isNum && !(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  } else if (!isNum && num !== undefined) {
    throw new TypeError("Invalid seed prop");
  }
};
