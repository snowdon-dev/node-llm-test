import {
  pangramsDefault,
  blankWordToken,
  chaosWords,
  equalSymblsSet,
  rotN,
  toBinary,
  capitalizeFirstLetter,
} from "./characters";
import {
  ExpressionDefinitionType,
  ExpressionPart,
  IExpressionResult,
  ILLMTest,
  SymbolExpression,
  SymbolTypeOptions,
} from "./interface";
import { IPrepareResult } from "./interface";
import { Feature, hasFeature, levelMax } from "./levels";
import { getRandomOrder, mulberry32, randomizeRecord } from "./random";

interface IAnswerContext {
  tokenMap: Record<string, string>;
  realMap: Record<string, string>;

  partialWords: string[];

  correctAnswer: string;
}

const validateLevel = (i: number) => {
  if (!(i >= 0 && i <= levelMax)) {
    throw new TypeError("Invalid level");
  }
};

const validatePangrans = (list: string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("Invalid pangram list");
  }
};

const validateSeed = (num: number) => {
  if (!(num > 0 && num <= 2 ** 31 - 1)) {
    throw new TypeError("Invalid seed number");
  }
};

export class Puzzle implements ILLMTest {
  /**
   * @param inputWords A list of words to be appended into a word list of the
   * language
   * @param seed A unique seed to preserve determinism or null to use Math.random.
   * @param panagrams A list of pangrams to select from
   * @param level The hardness of the game
   */
  static New = (
    inputWords: undefined | string[],
    seed: undefined | number,
    pangrams: undefined | string[],
    level: undefined | number,
  ) => {
    const builder = new PuzzleBuilder(level, inputWords, pangrams, seed);
    return new Puzzle(builder.prepare(), builder.level);
  };

  private constructor(
    public readonly result: Readonly<IPrepareResult>,
    private readonly level: number,
  ) {}

  public print(output: (...outs: string[]) => unknown) {
    return print(
      this.result.partialTokenizedSentence,
      this.result.tokenMap,
      this.result.expression,
      this.result.symbolExpression,
      this.level,
      output,
    );
  }

  public answer(strIn: string) {
    return answer(strIn, {
      tokenMap: this.result.tokenMap,
      realMap: this.result.realMap,

      partialWords: this.result.partialWords,
      correctAnswer: this.result.correctAnswer,
    });
  }
}

export class PuzzleBuilder {
  private readonly rand: (num: number) => number;
  private readonly sentenceIdx: number;
  private readonly words: string[];
  private readonly sentence: string;

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
    this.words = this.sentence.split(/\s+/);
  }

  prepare(): IPrepareResult {
    const expression = this.buildExpresion();

    const { totalWords, nPWordsPar } = this.preapreTotalWords();
    const { tokenMap, realMap, tokenizedEntries, tokenStartWordIdx } =
      this.prepareMappings(totalWords, nPWordsPar);

    const tokenizedSequenceWords = tokenizedEntries;
    const tokenRefRemoveIdx = this.rand(tokenizedSequenceWords.length - 1);

    const missingWordIdx = tokenStartWordIdx[tokenRefRemoveIdx];

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].join(" ");
    const realAnswer = this.words[missingWordIdx];

    if ([correctAnswer, realAnswer].includes(undefined)) {
      throw new Error("Mapping failure");
    }

    // insert a missing identifier
    const symbolExpression = this.buildSymbolExpression();
    const partialTokenizedWords = [...tokenizedSequenceWords].map(
      symbolExpression.mapper,
    );
    const isPartialReason = hasFeature(this.level, Feature.PARTIAL_REASINING);
    const activePartial = [...partialTokenizedWords[tokenRefRemoveIdx]];
    if (isPartialReason && activePartial.length !== 1 && this.rand(1) > 0) {
      activePartial[0] = blankWordToken;
      partialTokenizedWords[tokenRefRemoveIdx] = activePartial;
    } else {
      // TODO: hide half a word
      partialTokenizedWords[tokenRefRemoveIdx] = [blankWordToken];
    }

    const partialWords = [...this.words];
    partialWords[missingWordIdx] = blankWordToken;

    const partialTokenizedSentence = partialTokenizedWords
      .map((w) => w.join(" "))
      .join(" ");

    const tokenizedSentence = tokenizedSequenceWords
      .map((w) => w.join(" "))
      .join(" ");

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

  protected preapreTotalWords() {
    const wordsSet = new Set(this.words);

    const totalWords = new Set<string>();
    for (let i = 0; i < this.inputWords.length; i++) {
      totalWords.add(this.inputWords[i]);
    }

    if (hasFeature(this.level, Feature.CHAOS_WORDS)) {
      // Add words that are intended to cause chaos
      for (let i = 0; i < this.pangrams.length; i++) {
        if (i === this.sentenceIdx) {
          continue;
        }
        const pangramSentence = this.pangrams[i];
        for (const v of pangramSentence.split(/\s/)) {
          if (/\W/.test(v)) {
            throw Error("Found non word chars - not supported");
          }
          if (wordsSet.has(v)) {
            continue;
          }
          totalWords.add(v);
        }
      }
      for (let elm of chaosWords) {
        const lower = elm.toLowerCase();
        if (!wordsSet.has(lower)) {
          totalWords.add(lower);
        }
        const upper = capitalizeFirstLetter(elm);
        if (!wordsSet.has(upper)) {
          totalWords.add(upper);
        }
      }
    }

    const nPWordsPar = totalWords.size;

    for (let i = 0; i < this.words.length; i++) {
      totalWords.add(this.words[i]);
    }

    return { totalWords, nPWordsPar };
  }

  protected prepareMappings(totalWords: Set<string>, nPWordsPar: number) {
    const inputDeduped = Array.from(totalWords);
    const randomArr = getRandomOrder(inputDeduped.slice(), this.rand);
    const tokenMap: Record<string, string> = {};
    const realMap: Record<string, string> = {};

    const popNonDuplicate = () => randomArr.pop();
    const popDuplicate = () => inputDeduped[this.rand(inputDeduped.length - 1)];
    const firstPlacement = popNonDuplicate;
    const secondPlacement = popDuplicate;

    function popToken(multi = false): string[] {
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

      const secondtoken = secondPlacement();

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

    const useMultI = hasFeature(this.level, Feature.MULTIZE_I_TOKENS);
    const useSecond = hasFeature(this.level, Feature.MULTIZE_TOKENS);

    const build = (idx: number, partEnd: number) => {
      const sTokenRoll = this.rand(1) > 0;
      const multiWordRoll =
        useMultI && this.rand(1) > 0
          ? // can't read a word thats at set end
            idx !== partEnd - 1
          : false;

      let multiToken: boolean = useSecond ? sTokenRoll : false;
      const token = popToken(multiToken);

      const tokenStr = token.join(" ");
      const word = inputDeduped[idx];

      let tokenItems = token;
      let reads = 1;
      let words = [word];

      if (multiWordRoll) {
        // sometimes takes two words
        const nextWord = inputDeduped[idx + 1];
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

    // for only non sentence words
    for (let debupedIdx = 0; debupedIdx < nPWordsPar; debupedIdx++) {
      const info = build(debupedIdx, nPWordsPar);
      debupedIdx += info.reads - 1;
    }

    // insert the sentence words
    const tokenizedEntries = [];
    const tokenStartWordIdx: number[] = [];

    let wordIdx = 0;
    for (let npwi = nPWordsPar; npwi < inputDeduped.length; npwi++) {
      const info = build(npwi, inputDeduped.length);
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
    if (!hasFeature(this.level, Feature.INDIRECT_SYMBOLS)) {
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
    // Build an expression
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

/**
 * - read a single answer
 * - If the characters are a word and its letters complete the alphabet
 *
 * TODO: multi-words - if we are given lots of words, parse out the answer
 */
export function answer(strIn: string, context: Readonly<IAnswerContext>) {
  if (strIn === context.correctAnswer) {
    // if the word equals the correct word. HURRAH
    return {
      exact: true,
      possible: false,
    };
  }
  if (strIn.length > 0) {
    const wordSequence = context.realMap[strIn]; // token to real
    if (wordSequence === undefined) {
      return { exact: false, possible: false };
    }
    if (context.tokenMap[wordSequence] === undefined) {
      return { exact: false, possible: false };
    }

    // check it completes the sentence
    // insert into the partial sentence
    const idx = context.partialWords.indexOf(blankWordToken);
    const tmpRealWords = [...context.partialWords];
    tmpRealWords.splice(idx, 1, wordSequence);
    const charsSet = new Set(
      tmpRealWords.join("").replaceAll(" ", "").toLowerCase().split(""),
    );
    if (charsSet.size !== 26) {
      return { exact: false, possible: false };
    }

    // TODO: word or Word - if removedWordIdx = 0, then its real need to start
    // with a capital. Unless i remove capitals
    // code >= 65 && code <= 90

    // not true, but potentially true
    return { exact: false, possible: true, possibleReal: wordSequence };
  }
  throw Error("Answer failure");
}

export function getMappingMessage(
  oldS: string,
  newS: string,
  symbol: string,
  expressionDefinition: ExpressionPart[],
): string {
  const parts = {
    [ExpressionPart.NEW_OPARAND]: `'${newS}'`,
    [ExpressionPart.OLD_OPARAND]: `'${oldS}'`,
    [ExpressionPart.OPERATOR]: `${symbol}`,
  };
  const build = expressionDefinition.map((key) => parts[key]);

  build.splice(1, 0, " ");
  build.splice(3, 0, " ");

  return build.join("");
}

export function getInitialDescription(
  symbol: string,
  expressionDefinition: ExpressionPart[],
  symbolExpression: SymbolExpression<SymbolTypeOptions>,
  excludeMappingInfo: boolean = false,
): string {
  const order = expressionDefinition
    .map((item) => {
      switch (item) {
        case ExpressionPart.NEW_OPARAND:
          return "encoded symbol(s)";
        case ExpressionPart.OLD_OPARAND:
          return "decoded symbol(s)";
        case ExpressionPart.OPERATOR:
          return null;
      }
    })
    .filter((v) => v !== null);

  let symbolExpMsg: string;
  switch (symbolExpression.options.type) {
    case "none": {
      symbolExpMsg = "";
      break;
    }
    case "rot": {
      symbolExpMsg = `Each mapping entry in the symbolised sequence has been encoded with ROT${symbolExpression.options.rotNNum}.\n`;
      break;
    }
    case "binary": {
      symbolExpMsg = `Each mapping entry in the symbolised sequence has been encoded with binary.\n`;
      break;
    }
    case "binaryrot": {
      symbolExpMsg = `Each mapping entry in the symbolised sequence has been encoded with ROT${symbolExpression.options.rotNNum} and then converted to binary.\n`;
      break;
    }
    default: {
      throw new Error("Brah");
    }
  }

  return (
    // remove? too descriptive
    //"The following describes a puzzle. " +
    //"To complete the game you must figure out the missing word, without asking any questions.\n\n" +
    "You will be given a character sequence that contains a missing part, and has been encoded into a symbolised form.\n" +
    symbolExpMsg +
    `The '${symbol}' operator defines a mapping between two character sequences enclosed in single quotes.` +
    "\nEach mapping entry in the table is separated by a newline " +
    "(\\n) character." +
    (excludeMappingInfo
      ? ""
      : `\nThe ${order[0]} is first in the mapping expression.`)
  );
}

export function getTableMappingHeader(): string {
  return "\nTable of mappings:";
}
export function getInstructionsMessage(): string {
  // this could be memorised
  return (
    "\n\nTake into account the given symbolised sequence of words and\n" +
    "other contextual information. Complete the following tasks: \n\n" +
    //"- Find the missing symbol or symbols the sentence.\n" + // descriptive level?
    "- Find the missing mapping entry required to decode the sequence.\n" +
    "- Show the missing encoded word needed to find the decoded word.\n" +
    "- Show the answer as concisely as possible.\n" +
    "- Do not ask any questions.\n" +
    "- Think for as long as needed and only reply when confident.\n"
    //"- Show the puzzles given sentence in the symbolised form.\n" +
    //"- Do not provide the answer in the decoded form.\n"
    //"- Provide the answer in the symbolised form.\n\n"
    // TODO: at random look for word or symbol sequence
  );
}

export function getSymbolisedSentenceOutput(
  partialTokenizedSentence: string,
): string {
  return (
    "Symbolised sentence with missing word(s):\n" + partialTokenizedSentence
  );
}

export function print(
  partialTokenizedSentence: string,
  tokenMap: Record<string, string>,
  expression: IExpressionResult,
  symbolExpression: SymbolExpression<SymbolTypeOptions>,
  level: number,
  output: (outs: string) => void,
) {
  const symbol = expression.equalSymbol;

  output(
    getInitialDescription(
      symbol,
      expression.expressionDefinition,
      symbolExpression,
      hasFeature(level, Feature.EXLUDE_MAPPING_INFO),
    ),
  );

  output(getTableMappingHeader());
  Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS]) => {
    output(
      getMappingMessage(old, newS, symbol, expression.expressionDefinition),
    );
  });

  output(getInstructionsMessage());
  output(getSymbolisedSentenceOutput(partialTokenizedSentence));
}
