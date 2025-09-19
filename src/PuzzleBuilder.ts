import {
  pangramsDefault,
  blankWordToken,
  chaosWords,
  capitalizeFirstLetter,
  rotN,
  toBinary,
  equalSymblsSet,
  reverseFirstLetter,
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
import { mulberry32, getRandomOrder } from "./random";

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

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].join(" ");
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

    const useMultI = this.hasFeature(Feature.MULTIZE_I_TOKENS);
    const useSecond = this.hasFeature(Feature.MULTIZE_TOKENS);
    const spacingChars = " ";

    type TokenType = [string] | [string, string];
    const readWords = (
      idx: number,
      array: string[],
      multiActivation: boolean,
    ) => {
      const multiWordRoll =
        multiActivation && this.rand(1) > 0
          ? // can't read a word thats at set end
            idx !== array.length - 1
          : false;

      const word = array[idx];
      let words: TokenType;

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

      let token: TokenType;
      if (useSecond && this.rand(1) > 0) {
        token = [elm, sliding.pop()];
      } else {
        token = [elm];
      }
      return token;
    };

    let missingWords = [];
    const totalWordsSliding = [];

    const debupedTokens: Record<string, TokenType> = {};
    for (let debupedIdx = 0; debupedIdx < inputDeduped.length; debupedIdx++) {
      const words = readWords(debupedIdx, inputDeduped, useMultI);
      debupedIdx += words.length - 1;
      const wordsStr = words.join(spacingChars);
      debupedTokens[wordsStr] = words;
      if (words.length > 1) {
        missingWords.push(words);
      }
      totalWordsSliding.push(wordsStr);
    }
    const chaosTokens: Record<string, TokenType> = {};
    if (this.hasFeature(Feature.EXTRA_WORDS)) {
      for (let i = 0; i < this.pangramsWordsList.length; i++) {
        const words = readWords(i, this.pangramsWordsList, useMultI);
        i += words.length - 1;
        const wordsStr = words.join(spacingChars);
        chaosTokens[wordsStr] = words;
        if (words.length > 1) {
          missingWords.push(words);
        }
        totalWordsSliding.push(wordsStr);
      }
    }
    const tokenStartWordIdx: number[] = [];
    const sentenceTokens: Record<string, TokenType> = {};
    let wordIdx = 0;
    for (let npwi = 0; npwi < this.words.length; npwi++) {
      const words = readWords(npwi, this.words, useMultI);
      npwi += words.length - 1;
      tokenStartWordIdx.push(wordIdx);
      const wordsStr = words.join(spacingChars);
      sentenceTokens[wordsStr] = words;
      wordIdx += words.length;
      if (words.length > 1) {
        missingWords.push(words);
      }
      totalWordsSliding.push(wordsStr);
    }

    getRandomOrder(totalWordsSliding, this.rand);

    const buildTokens = () => {
      const totalInput = getRandomOrder(
        [...inputDeduped, ...(this.pangramsWordsList ?? []), ...this.words],
        this.rand,
      );
      let tokens = [];
      for (let i = 0; i < totalInput.length; i++) {
        const words = readTokens(i, totalInput, totalWordsSliding);
        tokens.push(words.join(spacingChars));
      }
      return tokens;
    };

    const tmpTotalWords = totalWordsSliding.slice();

    const buildTokenMap = () => {
      const totalTokens =
        useSecond === useMultI
          ? getRandomOrder(totalWordsSliding, this.rand)
          : buildTokens();

      return function (words: string) {
        const tokens = totalTokens.pop();
        tokenMap[words] = tokens;
        realMap[tokens] = words;
      };
    };

    const tokenMapper = buildTokenMap();

    for (let i = 0; i < missingWords.length; i++) {
      // ensure same number of lost words entries as tokens
      // random words, not already used
      const useMulti = useSecond && this.rand(1) > 0;
      let tmp: TokenType;
      const elms = missingWords[i];
      if (useMulti) {
        const nextWord =
          totalWordsSliding[this.rand(totalWordsSliding.length - 1)];
        tmp = elms.concat(nextWord);
      } else {
        tmp = elms;
      }
      tokenMapper(elms.join(spacingChars));
    }

    for (let i = 0; i < tmpTotalWords.length; i++) {
      const tmpWords = tmpTotalWords[i];
      if (tokenMap[tmpWords]) {
        continue;
      }
      tokenMapper(tmpWords);
    }

    const tokenizedEntries: string[][] = Object.values(sentenceTokens).map(
      (token) => {
        return tokenMap[token.join(spacingChars)].split(" ");
      },
    );

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
