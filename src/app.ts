import { getRandomOrder, mulberry32, randomizeRecord } from "./random";

const equalSymblsSet = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "**",
  "++",
  "--",
  "!=",
  "!==",
  ">",
  "<",
  ">=",
  "<=",
  "&&",
  "||",
  "!",
  "??",
  "&",
  "|",
  "^",
  "~",
  "<<",
  ">>",
  ">>>",
  "?",
  ":",
  "...",
  ",",
  ".",
  "[]",
  "()",
  "{}",
  "=>",
];

const pangramsDefault = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly",
  "Jackdaws love my big sphinx of quartz",
  "Two driven jocks help fax my big quiz",
  "Grumpy wizards make toxic brew for the evil queen and Jack",
  "Just keep examining every low bid quoted for zinc etchings",
  "Big fjords vex quick waltz nymph",

  // Can't use this because comma breaks the words.join(' ') logic
  //"Sphinx of black quartz, judge my vow",
  //"Quick zephyrs blow, vexing daft Jim",
  //"Waltz, bad nymph, for quick jigs vex",
];

export enum ExpressionPart {
  NEW_OPARAND,
  OPERATOR,
  OLD_OPARAND,
}

type ExpressionDefinitionType = [
  ExpressionPart,
  ExpressionPart,
  ExpressionPart,
];

export interface IExpressionResult {
  expressionDefinition: ExpressionDefinitionType;
  expressionType: string;
  equalSymbol: string;
}

export interface IPrepareResult {
  /** Map from the real to the tokenizedWor */
  tokenMap: Record<string, string>;
  /** Map from the tokenizedWord to the real word */
  realMap: Record<string, string>;

  tokenizedWords: string[];
  tokenizedSentence: string;
  partialTokenizedSentence: string;

  sentence: string;
  sentenceWords: string[];
  partialWords: string[];

  correctAnswer: string;
  realAnswer: string;

  expression: IExpressionResult;
}

export const blankWordToken = "[...]";

export function prepare(inputWords: string[], seed: number): IPrepareResult;
export function prepare(inputWords: string[], seed: null): IPrepareResult;
export function prepare(inputWords: string[]): IPrepareResult;
export function prepare(
  inputWords: string[],
  seed: number,
  pangrams: string[],
): IPrepareResult;
export function prepare(
  inputWords: string[],
  seed: null,
  pangrams: string[],
): IPrepareResult;

/**
 * @param inputWords A list of words to be appended into a word list of the language
 * @param seed A unique seed to preserve determinism or null to use Math.random.
 * @param panagrams A list of pangrams to select from
 */
export function prepare(
  inputWords: string[],
  seed: number | null = 12345,
  pangrams = pangramsDefault,
): IPrepareResult {
  const randH = seed !== null ? mulberry32(seed) : Math.random;
  const rand = (len: number) => Math.floor(randH() * (len + 1));

  const pangramsWords = pangrams.map((s) =>
    s.split(/\s+/).map((str) => str.replace(",", "")),
  );

  const pangramWordList = pangramsWords.flat();
  const sentenceIdx = rand(pangrams.length - 1);
  const sentence = pangrams[sentenceIdx];

  const words: string[] = sentence.split(/\s+/);

  // Map each unique word to a token
  const totalWords = new Set<string>();
  for (let i = 0; i < pangramWordList.length; i++) {
    totalWords.add(pangramWordList[i]);
  }
  for (let i = 0; i < inputWords.length; i++) {
    totalWords.add(inputWords[i]);
  }
  const inputDeduped = Array.from(totalWords);
  const randomArr = getRandomOrder(inputDeduped.slice(), rand);
  const tokenMap: Record<string, string> = {};
  const realMap: Record<string, string> = {};

  function popToken(): string {
    const idx = rand(inputDeduped.length - 1);
    return (
      // token without duplicates
      randomArr.pop() +
      // read a second (possible duplicate) word sometimes
      (rand(4) < 2 ? " " + inputDeduped[idx] : "")
    );
  }

  inputDeduped.forEach((word) => {
    const token = popToken();
    if (token === undefined || (token !== undefined && token.trim() === "")) {
      throw new Error("Token error + " + word);
    }

    // TODO: remove or add tokens. Either remove (maps to ''), or add tokens.

    // TODO:
    // At random a lookup references another table column.
    // token = {{reference "test"}}

    // TODO: word should not be a capital - since it gives away to much info
    tokenMap[word] = token;
    realMap[token] = word;
  });

  const removedWordIdx = rand(words.length - 1);

  const tokenizedWords: string[] = words.map((word) => tokenMap[word]);
  const tokenizedSentence: string = tokenizedWords.join(" ");
  const correctAnswer = tokenizedWords[removedWordIdx];
  const realAnswer = words[removedWordIdx];

  const partialTokenizedSentenceAsArray = [...tokenizedWords];
  partialTokenizedSentenceAsArray[removedWordIdx] = blankWordToken;

  const partialWords = [...words];
  partialWords[removedWordIdx] = blankWordToken;

  const partialTokenizedSentence = partialTokenizedSentenceAsArray.join(" ");

  const equalSymbol = equalSymblsSet[rand(equalSymblsSet.length - 1)];

  const expressionDefinition = getRandomOrder(
    [
      ExpressionPart.OLD_OPARAND,
      ExpressionPart.OPERATOR,
      ExpressionPart.NEW_OPARAND,
    ] as ExpressionDefinitionType,
    rand,
  );

  const idx = expressionDefinition.indexOf(ExpressionPart.OPERATOR);
  const expressionType = idx === 0 ? "prefix" : idx === 1 ? "infix" : "postfix";

  const expression: IExpressionResult = {
    expressionDefinition: expressionDefinition,
    expressionType,
    equalSymbol,
  };

  return {
    realMap,
    tokenMap,

    tokenizedWords,
    tokenizedSentence,
    partialTokenizedSentence,

    sentence,
    sentenceWords: words,
    partialWords,

    correctAnswer,
    realAnswer,

    expression,
  };
}

interface IAnswerContext {
  tokenMap: Record<string, string>;
  realMap: Record<string, string>;

  partialWords: string[];

  correctAnswer: string;
}

/**
 * TODO:
 * - read a single answer
 * - read all the chatgpt ouutput
 *
 * TODO:
 * - If the characters are a word and its letters complete the alphabet
 */
export function answer(
  strIn: string,
  context: Readonly<IAnswerContext>,
): boolean {
  void strIn;
  // TODO: if we are given lots of words, parse out the answer word?
  if (strIn === context.correctAnswer) {
    // if the word equals the correct word. HURRAH
    return true;
  }
  // - if we are given only one
  if (!/\s/.test(strIn) && strIn.length > 0) {
    const realWord = context.realMap[strIn];
    if (realWord === undefined) {
      return false;
    }
    const idx = context.partialWords.indexOf(blankWordToken);
    const tmpRealWords = [...context.partialWords];
    tmpRealWords[idx] = strIn;
    const chars = new Set(tmpRealWords.join("").toLowerCase().split("")).size;
    if (chars === 26) {
      // TODO: remove if I keep do not keep capitals as in the real
      if (idx === 0) {
        // if its at index 0
        const code = strIn[0].charCodeAt(0);
        if (code >= 65 && code <= 90) {
          // its uppercase for the starting letter
          // you've found a new answer that wan't expect HURRAH!
          return true;
        } else {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  throw Error("Reading whitespace is not supported.");
}

export function getInitialDescription(
  symbol: string,
  expressionDefinition: ExpressionPart[],
): string {
  const order = expressionDefinition
    .map((item) => {
      switch (item) {
        case ExpressionPart.NEW_OPARAND:
          return "new word";
        case ExpressionPart.OLD_OPARAND:
          return "old word";
        case ExpressionPart.OPERATOR:
          return null;
      }
    })
    .filter((v) => v !== null);

  return (
    "The following describes a puzzle. To complete the game you must figure out the missing word without asking any questions.\n\n" +
    "You will be given a sentence that has a missing word and has been converted into a symbolised form.\n" +
    `The operator '${symbol}' defines a mapping between two character ` +
    "sequences enclosed within ''.\nEach mapping in the table is separated by a newline " +
    "(\\n) character.\n" +
    `The ${order[0]} comes before ${order[1]} in the mapping expression.`
  );
}

export function getTableMappingHeader(): string {
  return "\n\n🗺️ Table of mappings:\n";
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

export function getInstructionsMessage(): string {
  return (
    "\n\nTake into account the given symbolised sentence and\n" +
    "other contextual information. Complete the following tasks: \n\n" +
    "- Find the missing word in the sentence.\n" +
    "- Print your answer as concisely as possible.\n" +
    "- Provide your answer for the missing word. And show the input sentence in symbolised form.\n" +
    "- Do not provide the answer in english. Provide the answer in the symbolised form.\n\n"
  );
}

export function getSymbolisedSentenceOutput(
  partialTokenizedSentence: string,
): string {
  return "Symbolised sentence with missing word:\n" + partialTokenizedSentence;
}

export function print(
  partialTokenizedSentence: string,
  tokenMap: Record<string, string>,
  expression: IExpressionResult,
  output: (...outs: { toString(): string }[]) => void,
) {
  const symbol = expression.equalSymbol;

  output(getInitialDescription(symbol, expression.expressionDefinition));

  output(getTableMappingHeader());
  Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS]) => {
    output(
      getMappingMessage(old, newS, symbol, expression.expressionDefinition),
    );
  });

  output(getInstructionsMessage());
  output(getSymbolisedSentenceOutput(partialTokenizedSentence));
}
