import {
  pangramsDefault,
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

export class PuzzleBuilder {
  private readonly rand: (num: number) => number;
  private readonly sentenceIdx: number;
  private readonly words: string[];
  private readonly sentence: string;
  private readonly pangramsWords?: string[][];
  private readonly pangramsWordsList?: string[];

  constructor(
    public readonly level: number | undefined = 0,
    private readonly inputWords: readonly string[] | undefined = [],
    private readonly pangrams: readonly string[] | undefined = pangramsDefault,
    private readonly seed: number | undefined = 12345,
  ) {
    validateLevel(level);
    validatePangrans(pangrams);
    validateSeed(seed);
    const randH = this.seed !== undefined ? mulberry32(this.seed) : Math.random;
    this.rand = (len: number) => Math.floor(randH() * (len + 1));
    this.sentenceIdx = this.rand(this.pangrams.length - 1);
    this.sentence = this.pangrams[this.sentenceIdx];
    if (this.hasFeature(Feature.EXTRA_WORDS)) {
      const words = this.pangrams.map((p) => p.split(/\s/));
      this.pangramsWords = words.filter((_, i) => i !== this.sentenceIdx);
      this.pangramsWordsList = this.pangramsWords.flat();
      this.words = words[this.sentenceIdx];
    } else {
      this.words = this.pangrams[this.sentenceIdx].split(/\s/);
    }
  }

  protected hasFeature(feature: Feature) {
    return hasFeature(this.level, feature);
  }

  prepare(): IPrepareResult {
    const expression = this.buildExpresion();

    const { tokenMap, realMap, tokenizedEntries, tokenStartWordIdx } =
      this.buildMappings();

    const tokenizedSequenceWords: string[][] = tokenizedEntries;
    const tokenRefRemoveIdx = this.rand(tokenizedSequenceWords.length - 1);

    const missingWordIdx = tokenStartWordIdx[tokenRefRemoveIdx];

    const correctAnswer =
      tokenizedSequenceWords[tokenRefRemoveIdx].join(spacingChars);
    const realAnswer = this.words[missingWordIdx];

    if ([correctAnswer, realAnswer].includes(undefined)) {
      throw new Error("Mapping failure");
    }

    // insert a missing identifier
    const partialWords = [...this.words];
    partialWords[missingWordIdx] = blankWordToken;

    const wordsSeqs = tokenStartWordIdx.map((start, i) => {
      const next = tokenStartWordIdx[i + 1];
      const end = next ? next : this.words.length;
      return this.words.slice(start, end);
    });

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

      sentence: this.sentence,

      sentenceWords: this.words,
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

  protected preapreOtherWords() {
    const excludeWordsSet = new Set([
      ...this.words,
      ...(this.pangramsWordsList ?? []),
    ]);
    const otherWords = new Set<string>();
    for (let i = 0; i < this.inputWords.length; i++) {
      if (!excludeWordsSet.has(this.inputWords[i])) {
        otherWords.add(this.inputWords[i]);
      }
      if (this.hasFeature(Feature.CHAOS_WORDS)) {
        const other = reverseFirstLetter(this.inputWords[i]);
        if (!excludeWordsSet.has(other)) {
          otherWords.add(other);
        }
      }
    }
    if (this.hasFeature(Feature.EXTRA_WORDS)) {
      for (let i = 0; i < this.pangramsWordsList.length; i++) {
        const v = this.pangramsWordsList[i];
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

    if (this.hasFeature(Feature.CHAOS_WORDS)) {
      for (let i = 0; i < this.words.length; i++) {
        otherWords.add(reverseFirstLetter(this.words[i]));
      }
    }
    return otherWords;
  }

  protected buildMappings() {
    const otherWords = this.preapreOtherWords();

    const randomDedupedWords = getRandomOrder(
      Array.from(otherWords),
      this.rand,
    );

    return this.prepareMappings(randomDedupedWords);
  }

  protected prepareMappings(inputDeduped: string[]) {
    const tokenMap: Record<string, string> = {};
    const realMap: Record<string, string> = {};

    const useMultiInput = this.hasFeature(Feature.MULTIZE_I_TOKENS);
    const useMultiTokens = this.hasFeature(Feature.MULTIZE_TOKENS);

    const otherWordLists = [inputDeduped, this.pangramsWordsList].filter(
      (v) => v !== void 0,
    );
    const totalWordBuckets = [...otherWordLists, this.words];

    const totalBucketLength = totalWordBuckets.reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    type SymbolType = [string] | [string, string];

    const readWords = (idx: number, array: string[]) => {
      const multiWordRoll =
        useMultiInput && this.rand(1) > 0
          ? idx !== array.length - 1
          : false;

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

    const readTokens = (idx: number, array: string[], sliding: string[]) => {
      const elm = array[idx];

      let token: SymbolType;
      if (useMultiTokens && this.rand(1) > 0) {
        token = [elm, sliding.pop()];
      } else {
        token = [elm];
      }
      return token;
    };

    const totalWordsSliding: string[] = [];

    const addMissingWords = (words: SymbolType) => {
      if (words.length === 2) {
        return [[words[0]], [words[1]]]
      }

      const [idx, bucket] = pickRandomBucket(
        totalWordBuckets,
        totalBucketLength,
        this.rand,
      );

      let nextWord = bucket[idx];
      //if (words[1] !== undefined && nextWord === words[1]) {
      //  nextWord = bucket[(idx + 1) % bucket.length];
      //}
      // len 1
      return [[words[0], nextWord]];
    };

    const findWords = (words: SymbolType) => {
      if (useMultiTokens && useMultiInput) {
        const missing = addMissingWords(words);
        // if 2 words, want two one words
        // if 1 words, want a onw two words
        return [words, ...missing].map((s) => s.join(spacingChars));
      }
      // if 00 . both sides single words - no missing words
      // if 01 or 10 . one side has missing no missing words
      return [words.join(spacingChars)];
    }

    function buildWords(arr: string[]) {
      for (let i = 0; i < arr.length; i++) {
        const words = readWords(i, arr);
        i += words.length - 1;
        totalWordsSliding.push(...findWords(words));
      }
    }


    otherWordLists.forEach((list) => buildWords(list));

    const tokenStartWordIdx: number[] = [];
    const sentenceWordsStr: string[] = [];
    let wordIdx = 0;
    for (let npwi = 0; npwi < this.words.length; npwi++) {
      const words = readWords(npwi, this.words);
      npwi += words.length - 1;
      tokenStartWordIdx.push(wordIdx);
      wordIdx += words.length;
      const wordsStrs = findWords(words);
      totalWordsSliding.push(...wordsStrs);
      sentenceWordsStr.push(wordsStrs[0]);
    }

    getRandomOrder(totalWordsSliding, this.rand);

    const buildTokens = () => {
      const totalInput = getRandomOrder(totalWordBuckets.flat(), this.rand);
      let tokens: string[] = [];
      for (let i = 0; i < totalInput.length; i++) {
        const words = readTokens(i, totalInput, totalWordsSliding);
        tokens.push(words.join(spacingChars));
      }
      return tokens;
    };

    const tmpTotalWords = totalWordsSliding.slice();

    const totalTokens =
      useMultiTokens === useMultiInput
        ? getRandomOrder(totalWordsSliding, this.rand)
        : buildTokens();

    for (let i = 0; i < tmpTotalWords.length; i++) {
      const tmpWordsStr = tmpTotalWords[i];
      if (tokenMap[tmpWordsStr]) {
        continue;
      }
      const tokensStr = totalTokens.pop();
      tokenMap[tmpWordsStr] = tokensStr;
      realMap[tokensStr] = tmpWordsStr;
    }

    const tokenizedEntries: string[][] = sentenceWordsStr.map((wordsStr) => {
      return tokenMap[wordsStr].split(spacingChars);
    });

    return {
      tokenMap,
      realMap,

      tokenizedEntries,
      tokenStartWordIdx,
    };
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

export const validateLevel = (i: number) => {
  if (!(i >= 0 && i <= levelMax)) {
    throw new TypeError("Invalid level");
  }
};

export const validatePangrans = (list: readonly string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("Invalid pangram list");
  }
};

export const validateSeed = (num: number) => {
  if (!(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  }
};
