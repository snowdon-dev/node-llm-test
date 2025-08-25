import {
  blankWordToken,
  instructionSet,
  isFirstCharCapital,
  rotN,
} from "./characters";
import {
  ExpressionPart,
  IExpressionResult,
  ILLMTest,
  SymbolExpression,
  SymbolRotOptions,
  SymbolTypeOptions,
} from "./interface";
import { IPrepareResult } from "./interface";
import { Feature, hasFeature } from "./levels";
import { PuzzleBuilder } from "./PuzzleBuilder";
import { getRandomOrder, randomizeRecord, simpleRandom } from "./random";

interface IAnswerContext {
  tokenMap: Readonly<Record<string, string>>;
  realMap: Readonly<Record<string, string>>;

  partialWords: Readonly<string[]>;

  correctAnswer: Readonly<string>;

  sentenceWords: Readonly<string[]>;
}

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
      sentenceWords: this.result.sentenceWords,
    });
  }
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
    const idx = context.partialWords.indexOf(blankWordToken);
    const tmpRealWords = [...context.partialWords];

    const realWord = context.sentenceWords[idx];

    if (isFirstCharCapital(realWord) !== isFirstCharCapital(wordSequence)) {
      return { exact: false, possible: false };
    }

    // insert into the partial sentence
    tmpRealWords.splice(idx, 1, wordSequence);
    const charsSet = new Set(
      tmpRealWords.join("").replaceAll(" ", "").toLowerCase().split(""),
    );
    if (charsSet.size !== 26) {
      return { exact: false, possible: false };
    }

    // not true, but potentially true
    // word sequence should be checked to see if it's in the dictionary
    return { exact: false, possible: true, possibleReal: wordSequence };
  }
  throw Error("Answer failure");
}

export function getMappingMessage(
  oldS: string,
  newS: string,
  symbol: string,
  expressionDefinition: ExpressionPart[],
  i: number,
  isMappingPuzzle: boolean,
): string {
  const computeMathExpression = (n: number, d: number) =>
    Math.floor((n * 7) / d) % 2;

  const parts = {
    [ExpressionPart.NEW_OPARAND]: `'${newS}'`,
    [ExpressionPart.OLD_OPARAND]: `'${oldS}'`,
    [ExpressionPart.OPERATOR]: `${symbol}`,
  };

  let build = expressionDefinition.map((key) => parts[key]);

  if (isMappingPuzzle) {
    if (computeMathExpression(i, 3) !== 0) {
      build = build.reverse();
    }
  }

  build.splice(1, 0, " ");
  build.splice(3, 0, " ");

  return build.join("");
}

export function getInitialDescription(
  symbol: string,
  expressionDefinition: ExpressionPart[],
  symbolExpression: SymbolExpression<SymbolTypeOptions>,
  excludeMappingInfo: boolean = false,
  instructionWords: typeof instructionSet,
  isMappingPuzzle: boolean,
): string {
  const order = expressionDefinition
    .map((item) => {
      switch (item) {
        case ExpressionPart.NEW_OPARAND:
          return instructionWords.symbolIndent.e;
        case ExpressionPart.OLD_OPARAND:
          return instructionWords.symbolIndent.d;
        case ExpressionPart.OPERATOR:
          return null;
      }
    })
    .filter((v) => v !== null);

  let symbolExpMsg: string;
  const msgStart = instructionWords.symbolEncoding;
  const getRotChars = (s: SymbolExpression<SymbolRotOptions>) =>
    instructionWords.characterDigitAlpha[s.options.rotNNum];
  switch (symbolExpression.options.type) {
    case "none": {
      symbolExpMsg = "";
      break;
    }
    case "rot": {
      symbolExpMsg = `${msgStart} ${instructionWords.encodingIdent.rot} ${getRotChars(symbolExpression as any)}`;
      break;
    }
    case "binary": {
      symbolExpMsg = `${msgStart} ${instructionWords.encodingIdent.binary}`;
      break;
    }
    case "binaryrot": {
      symbolExpMsg = `${msgStart} ${instructionWords.encodingIdent.rot} ${getRotChars(symbolExpression as any)} ${instructionWords.multiEncodings} ${instructionWords.encodingIdent.binary}`;
      break;
    }
    default: {
      throw new Error("Invalid symbol expression");
    }
  }

  let mappingDelm = `${instructionWords.mappingDetails.start} '${symbol}' ${instructionWords.mappingDetails.ending}`;

  let mappingDetails = `${instructionWords.mappingDetails.excludeStart} ${order[0]} ${instructionWords.mappingDetails.excludeEnd}`;

  if (isMappingPuzzle) {
    mappingDetails = `${instructionWords.mappingDetails.puzzleStart}. ${instructionWords.mappingDetails.excludeStart} ${order[0]} ${instructionWords.mappingDetails.puzzleEnd}`;
  }

  if (excludeMappingInfo) {
    mappingDetails = null;
  }

  const lines = [
    // remove? too descriptive
    //"The following describes a puzzle. " +
    //"To complete the game you must figure out the missing word, without asking any questions.\n\n" +
    instructionWords.introMsg,
    symbolExpMsg !== "" ? symbolExpMsg : null,
    mappingDelm,
    instructionWords.mappingDetails.delemiter,
    mappingDetails,
    instructionWords.snowdondevident,
  ]
    .filter((l) => l !== null)
    .map((line) => line + ".");

  return lines.join("\n");
}

export function getTableMappingHeader(
  instructionWords: typeof instructionSet,
): string {
  return instructionWords.mappingHeader + ":";
}

export function getInstructionsMessage(
  indirectSymbols: boolean,
  instructionWords: typeof instructionSet,
  random: boolean,
): string {
  const instructions: string[] = [...instructionWords.all];
  if (indirectSymbols) {
    instructions.push(...instructionWords.indirect);
  }

  const list = instructions.map((l) => "- " + l);

  if (random) {
    getRandomOrder(list, simpleRandom);
  }

  return [
    instructionWords.instructionIntro.join(".\n") + ":",
    list.join("\n"),
  ].join("\n");
}

export function getSymbolisedSentenceOutput(
  partialTokenizedSentence: string,
  instructionWords: typeof instructionSet,
): string {
  return (
    instructionWords.identSymbolSentence + ":\n" + partialTokenizedSentence
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
  const randomOrder = hasFeature(level, Feature.INSTRUCTION_ORDER);

  const hasRandomShift = hasFeature(level, Feature.OUTPUT_SHIFT);
  const randomShift = simpleRandom(25);
  const outputter = hasRandomShift
    ? (str: string) => output(rotN(str, randomShift))
    : output;

  const parts: (() => void)[] = [];

  let instructionWords = instructionSet;

  const isMappingPuzzle = hasFeature(level, Feature.MAPPING_INFO_PUZZLE);

  parts.push(() =>
    outputter(
      getInitialDescription(
        symbol,
        expression.expressionDefinition,
        symbolExpression,
        hasFeature(level, Feature.EXCLUDE_MAPPING_INFO),
        instructionWords,
        isMappingPuzzle,
      ),
    ),
  );

  parts.push(() => {
    outputter(getTableMappingHeader(instructionWords));
    Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS], i) => {
      outputter(
        getMappingMessage(
          old,
          newS,
          symbol,
          expression.expressionDefinition,
          i,
          isMappingPuzzle,
        ),
      );
    });
  });

  parts.push(() => {
    outputter(
      getInstructionsMessage(
        hasFeature(level, Feature.INDIRECT_SYMBOLS),
        instructionWords,
        hasFeature(level, Feature.INSTRUCTION_ORDER),
      ),
    );
  });

  parts.push(() =>
    outputter(
      getSymbolisedSentenceOutput(partialTokenizedSentence, instructionWords),
    ),
  );

  if (randomOrder) {
    getRandomOrder(parts, simpleRandom);
  }

  if (
    hasRandomShift &&
    !hasFeature(level, Feature.OUTPUT_SHIFT_EXLCUDE_DETAILS)
  ) {
    output(
      `The following message [a-zA-Z] characters have been encoded with ROT ${instructionWords.characterDigitAlpha[randomShift]}:\n`,
    );
  }

  parts.forEach((fn, i) => {
    fn();
    if (i < parts.length - 1) {
      outputter("");
    }
  });
}
