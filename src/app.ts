import { mulberry32, randomizeRecord } from "./random";

enum ExpressionParts {
  NEW_OPARAND,
  OPERATOR,
  OLD_OPARAND,
}

interface IExpressionResult {
  expressionDefinition: ExpressionParts[];
  expressionType: string;
  equalSymbol: string;
}

const sentenceDefault: string = "The quick brown fox jumps over the lazy dog";

export function prepare(
  inputWords: string[],
  seed = 12345,
  sentence: string = sentenceDefault,
) {
  // Split into words
  const words: string[] = sentence.split(/\s+/);

  // Map each unique word to a token
  const tokenMap: Record<string, string> = {};

  const randH = mulberry32(seed);
  const rand = (len: number) => Math.floor(randH() * (len + 1));

  const subUsedWords = -words.length;
  const inputDeduped = new Set(
    words.concat(inputWords.slice(0, subUsedWords)),
  );

  /* pop from the input words to ensure zero mappings to sentence words */
  function popToken(): string {
    const idx = rand(inputWords.length);
    // TODO: Sometimes get two words
    const getDuplicateWord = rand(1);
    console.log(getDuplicateWord);
    const word = inputWords.splice(idx - 1, 1)[0];
    return word;
  }

  inputDeduped.forEach((word) => {
    const token = popToken();
    if (token === undefined) {
      throw new Error("Token error + " + word);
    }
    tokenMap[word] = token;
  });

  // TODO: englishWords may have captials..
  const partialTokenizedSentence: string = words
    .slice(0, -1)
    .map((word) => tokenMap[word])
    .join(" ");

  const tokenizedWords: string[] = words.map((word) => tokenMap[word]);
  const tokenizedSentence: string = tokenizedWords.join(" ");

  const equalSymblsSet = ["%", "!", "+", "-", "_"];

  const equalSymIdx = rand(equalSymblsSet.length);
  const equalSymbol = equalSymblsSet[equalSymIdx];
  const expressionDefinition = [
    ExpressionParts.OLD_OPARAND,
    ExpressionParts.OPERATOR,
    ExpressionParts.NEW_OPARAND,
  ];

  // randomize expression parts
  for (let k = 0; k < 4; k++) {
    for (let i = expressionDefinition.length - 1; i >= 0; i--) {
      const j = rand(i);
      [expressionDefinition[i], expressionDefinition[j]] = [
        expressionDefinition[j],
        expressionDefinition[i],
      ];
    }
  }

  const idx = expressionDefinition.indexOf(ExpressionParts.OPERATOR);
  const expressionType = idx === 0 ? "prefix" : idx === 1 ? "infix" : "postfix";

  const expression: IExpressionResult = {
    expressionDefinition: expressionDefinition,
    expressionType,
    equalSymbol,
  };

  return {
    tokenMap,
    tokenizedWords,
    tokenizedSentence,
    partialTokenizedSentence,

    expression,
  };
}

export function print(
  partialTokenizedSentence: string,
  tokenMap: Record<string, string>,
  expression: IExpressionResult,
  output: (...outs: { toString(): string }[]) => void,
) {
  const symbol = expression.equalSymbol;

  // Output
  output(
    `The symbol '${symbol}' defines a mapping between two character sequences in a table, with each mapping separated by a newline characters.`,
  );
  output("\n\n🗺️ Table of mappings:\n");

  Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS]) => {
    const parts = {
      [ExpressionParts.NEW_OPARAND]: newS,
      [ExpressionParts.OLD_OPARAND]: old,
      [ExpressionParts.OPERATOR]: ` ${symbol} `,
    };
    const msg = expression.expressionDefinition
      .map((key) => parts[key])
      .join(" ");

    output(msg + "\n");
  });

  const msg =
    "\n\nTake into account the given symbolized sentence and\n" +
    "other contextual information. Complete the following tasks: \n\n" +
    "- Finish the symbolised sentence.\n" +
    "- Print your answer as concisely as possible.\n" +
    "- Providing only the result as a symbolized sequence of character. And show the input sentence symbolized.\n" +
    "- Do not provide the answer in english. Provide the answer in the symbolised form.\n\n";

  output(msg);

  output("Incomplete symbolized sentence:\n" + partialTokenizedSentence);
}
