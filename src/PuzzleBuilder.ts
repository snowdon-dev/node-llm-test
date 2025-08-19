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
    private readonly inputWords: string[] | undefined = [],
    private readonly pangrams: string[] | undefined = pangramsDefault,
    private readonly seed: number | undefined = 12345,
  ) {
    validateLevel(level);
    validatePangrans(pangrams);
    validateSeed(seed);
    const randH = this.seed !== undefined ? mulberry32(this.seed) : Math.random;
    this.rand = (len: number) => Math.floor(randH() * (len + 1));
    this.sentenceIdx = this.rand(this.pangrams.length - 1);
    this.sentence = this.pangrams[this.sentenceIdx];
    if (this.hasFeature(Feature.CHAOS_WORDS)) {
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

    const tokenizedSequenceWords = tokenizedEntries;
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

    const res = {
      realMap,
      tokenMap,

      tokenizedWords: tokenizedSequenceWords,
      tokenizedSentence,
      partialTokenizedSentence,
      //partialTokenizedWords,
      sentence: this.sentence,
      sentenceWords: this.words,
      partialWords,

      correctAnswer,
      realAnswer,

      expression,
      symbolExpression,
    };

    return res;
  }

  /*protected getBucket(input: string[]) {
      return input;
      if (!hasFeature(level, Feature.HALF_SENTENCE)) {
        return input;
      }
      const midpointIndex = Math.floor(partialTokenizedWords.length / 2);
      const res =
        tokenRefRemoveIdx < missingWordIdx
          ? input.splice(midpointIndex - 1)
          : input.splice(0, midpointIndex + 1);
      return res;
    }*/

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
      const other = reverseFirstLetter(this.inputWords[i]);
      if (!excludeWordsSet.has(other)) {
        otherWords.add(other);
      }
    }
    if (this.hasFeature(Feature.CHAOS_WORDS)) {
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

    let randomArr = randomDedupedWords.slice();
    randomArr = randomArr.concat(this.words);
    if (this.pangramsWordsList) {
      randomArr = randomArr.concat(this.pangramsWordsList);
    }
    randomArr = getRandomOrder(randomArr, this.rand);

    return this.prepareMappings(randomDedupedWords, randomArr);
  }

  protected prepareMappings(inputDeduped: string[], randomArr: string[]) {
    const tokenMap: Record<string, string> = {};
    const realMap: Record<string, string> = {};

    const pickRandom = <T>(arrays: T[][]): T => {
      const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
      let randIndex = this.rand(totalLength - 1);
      for (const arr of arrays) {
        if (randIndex < arr.length) {
          return arr[randIndex];
        }
        randIndex -= arr.length;
      }

      throw new Error("Should never reach here");
    };

    const popNonDuplicate = () => randomArr.pop();
    const popDuplicate = () => {
      const arrs = [inputDeduped, this.pangramsWordsList, this.words].filter(
        (a) => a !== undefined,
      );
      return pickRandom(arrs);
    };
    const firstPlacement = popNonDuplicate;
    const secondPlacement = popDuplicate;

    function popToken(multi = false, useMulti: boolean = false): string[] {
      const tmptoken = firstPlacement();

      if (
        tmptoken === undefined ||
        (tmptoken !== undefined && tmptoken.trim() === "")
      ) {
        throw new Error("Token pop error");
      }
      if (!multi) {
        return [tmptoken];
      }

      const secondtoken = useMulti ? firstPlacement() : secondPlacement();

      if (
        multi &&
        (secondtoken === undefined ||
          (secondtoken !== undefined && secondtoken.trim() === ""))
      ) {
        throw new Error("Token second pop error");
      }

      // join em
      return [tmptoken, secondtoken];
    }

    const useMultI = this.hasFeature(Feature.MULTIZE_I_TOKENS);
    const useSecond = this.hasFeature(Feature.MULTIZE_TOKENS);

    const build = (idx: number, array: string[]) => {
      const sTokenRoll = this.rand(1) > 0;
      const multiWordRoll =
        useMultI && this.rand(1) > 0
          ? // can't read a word thats at set end
            idx !== array.length - 1
          : false;

      let multiToken: boolean = useSecond ? sTokenRoll : false;
      const useMulti = multiWordRoll;
      const token = popToken(multiToken, useMulti);

      const tokenStr = token.join(" ");
      const word = array[idx];

      let tokenItems = token;
      let reads = 1;
      let words = [word];

      if (multiWordRoll) {
        // sometimes takes two words
        const nextWord = array[idx + 1];
        words.push(nextWord);
        reads++;
        const mtw = `${word} ${nextWord}`;
        tokenMap[mtw] = tokenStr;
        realMap[tokenStr] = mtw;
      } else {
        tokenMap[word] = tokenStr;
        realMap[tokenStr] = word;
      }

      return { tokenItems, reads, words };
    };

    // for only non pangram words
    for (let debupedIdx = 0; debupedIdx < inputDeduped.length; debupedIdx++) {
      const info = build(debupedIdx, inputDeduped);
      debupedIdx += info.reads - 1;
    }

    // for all pangram words that are not words
    if (this.hasFeature(Feature.CHAOS_WORDS)) {
      for (let i = 0; i < this.pangramsWordsList.length; i++) {
        const info = build(i, this.pangramsWordsList);
        i += info.reads - 1;
      }
    }

    // insert the sentence words
    const tokenizedEntries = [];
    const tokenStartWordIdx: number[] = [];
    let wordIdx = 0;
    for (let npwi = 0; npwi < this.words.length; npwi++) {
      const info = build(npwi, this.words);
      tokenizedEntries.push(info.tokenItems);
      tokenStartWordIdx.push(wordIdx);
      // TODO: dont skip the next word consumed, given:
      // quick brown => fox brown
      // issue with reading the second consumed word:
      // brown fox => quick the
      npwi += info.reads - 1;
      wordIdx += info.reads;
    }

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

export const validatePangrans = (list: string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("Invalid pangram list");
  }
};

export const validateSeed = (num: number) => {
  if (!(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  }
};
