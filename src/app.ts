import { blankWordToken, isFirstCharCapital, rotN } from "./characters";
import {
  ExpressionPart,
  IExpressionResult,
  ILLMTest,
  SymbolExpression,
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
  const msgStart = "The symbolised sequence has also been encoded with";
  switch (symbolExpression.options.type) {
    case "none": {
      symbolExpMsg = "";
      break;
    }
    case "rot": {
      symbolExpMsg = `${msgStart} ROT${symbolExpression.options.rotNNum}.\n`;
      break;
    }
    case "binary": {
      symbolExpMsg = `${msgStart} binary.\n`;
      break;
    }
    case "binaryrot": {
      symbolExpMsg = `${msgStart} ROT${symbolExpression.options.rotNNum} and then converted to binary.\n`;
      break;
    }
    default: {
      throw new Error("Invalid symbol expression");
    }
  }

  return (
    // remove? too descriptive
    //"The following describes a puzzle. " +
    //"To complete the game you must figure out the missing word, without asking any questions.\n\n" +
    "You have been given a character sequence that contains a missing part, and has been encoded into a symbolised form.\n" +
    symbolExpMsg +
    `The '${symbol}' operator defines a mapping between two character sequences enclosed in single quotes.` +
    "\nEach mapping entry in the table is separated by a newline " +
    "(\\n) character." +
    (excludeMappingInfo
      ? ""
      : `\nThe ${order[0]} is first in the mapping expression.`) +
    "\nThe marketeer.snowdon.dev/tools/llmtest-online/"
  );
}

export function getTableMappingHeader(): string {
  return "Table of mappings:";
}

export function getInstructionsMessage(inDirectSymbols: boolean): string {
  // this could be memorised
  return (
    "Take into account the given symbolised sequence of words and " +
    "other contextual information.\nComplete the following tasks: \n\n" +
    //"- Find the missing symbol or symbols the sentence.\n" + // descriptive level?
    //"- Identify the mapping entry that is missing." +
    //"- Find the missing mapping entry required to decode the sequence.\n" +
    "- Determine the single mapping entry that is absent.\n" +
    //"- Show only the missing mapping entry sequence needed to find the decoded sequence.\n" +
    //"- Show only that missing mapping entry." +
    //"- Present exclusively that missing mapping entry." +
    "- Present only the symbol(s) that map to find the real word(s).\n" +
    (inDirectSymbols
      ? //? "- Do not show any encoding applied to the symbolised sequence.\n"
        //? "- Omit any extra encoding steps applied to the symbolised sentence."
        "- Omit any encoding applied on the symbolised sentence.\n"
      : "") +
    "- Show the answer as concisely as possible.\n" +
    "- Do not ask any questions.\n" +
    //"- Think for as long as needed and only reply when confident.\n"
    "- Think carefully and respond only when confident."

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
    "Symbolised sentence with missing part(s):\n" + partialTokenizedSentence
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

  parts.push(() =>
    outputter(
      getInitialDescription(
        symbol,
        expression.expressionDefinition,
        symbolExpression,
        hasFeature(level, Feature.EXCLUDE_MAPPING_INFO),
      ),
    ),
  );

  parts.push(() => {
    outputter(getTableMappingHeader());
    Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS]) => {
      outputter(
        getMappingMessage(old, newS, symbol, expression.expressionDefinition),
      );
    });
  });

  parts.push(() =>
    outputter(
      getInstructionsMessage(hasFeature(level, Feature.INDIRECT_SYMBOLS)),
    ),
  );
  parts.push(() =>
    outputter(getSymbolisedSentenceOutput(partialTokenizedSentence)),
  );

  if (randomOrder) {
    getRandomOrder(parts, simpleRandom);
  }

  if (
    hasRandomShift &&
    !hasFeature(level, Feature.OUTPUT_SHIFT_EXLCUDE_DETAILS)
  ) {
    output(
      `The following message [a-zA-Z] characters have been encoded with rot${randomShift}:\n`,
    );
  }

  parts.forEach((fn, i) => {
    fn();
    if (i < parts.length - 1) {
      outputter("");
    }
  });
}
