import { mulberry32 } from "./random";

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

export function prepare(englishWords: string[], seed = 12345) {
  const sentence: string = "The quick brown fox jumps over the lazy dog";

  // Split into words
  const words: string[] = sentence.split(/\s+/);

  // Create a Set of unique lowercase words
  const uniqueWords: Set<string> = new Set(
    words.map((word) => word.toLowerCase()),
  );

  // Map each unique word to a token
  const tokenMap: Record<string, string> = {};

  const rand = mulberry32(seed);

  function popToken(): string {
    const idx = Math.floor(rand() * words.length);
    // TODO: Sometimes get two words
    return englishWords.splice(idx, 1)[0];
  }

  new Set(Array.from(uniqueWords).concat(englishWords)).forEach((word) => {
    tokenMap[word] = popToken();
  });

  const partialTokenizedSentence: string = words
    .slice(0, -1)
    .map((word) => tokenMap[word.toLowerCase()])
    .join(" ");

  const tokenizedWords: string[] = words.map(
    (word) => tokenMap[word.toLowerCase()],
  );
  const tokenizedSentence: string = tokenizedWords.join(" ");

  const equalSymblsSet = ["%", "!", "+", "-", "_"];

  const equalSymIdx = Math.floor(rand() * equalSymblsSet.length);
  const equalSymbol = equalSymblsSet[equalSymIdx];
  const expressionDefinition = [
    ExpressionParts.OLD_OPARAND,
    ExpressionParts.OPERATOR,
    ExpressionParts.NEW_OPARAND,
  ];

  // randomize expression parts
  for (let k = 0; k < 4; k++) {
    for (let i = expressionDefinition.length - 1; i >= 0; i--) {
      const j = Math.floor(rand() * (i + 1));
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
  outputFunc: (...outs: { toString(): string }[]) => void,
) {
  // Input sentence
  function randomizeRecord(
    record: Record<string, string>,
  ): Record<string, string> {
    const entries = Object.entries(record);
    for (let step = 0; step < 2; step++) {
      // Shuffle using Fisher-Yates algorithm
      for (let i = entries.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entries[i], entries[j]] = [entries[j], entries[i]];
      }
    }
    // Convert back to a Record
    return Object.fromEntries(entries);
  }

  const symbol = expression.equalSymbol;

  // Output
  outputFunc(
    `\n\nThe symbol ${symbol} defines a mapping between two character sequences in a table seperated by newline characters.`,
  );
  outputFunc("\n\n🗺️ Table of mappings:\n");

  Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS]) => {
    const parts = {
      [ExpressionParts.NEW_OPARAND]: newS,
      [ExpressionParts.OLD_OPARAND]: old,
      [ExpressionParts.OPERATOR]: ` ${symbol} `,
    };
    const msg = expression.expressionDefinition
      .map((key) => parts[key])
      .join(" ");

    outputFunc(msg + "\n");
  });

  const msg =
    "\n\nTaking into account a given symbolized sentence, and\n" +
    "other contextual information. Complete the following tasks: \n\n" +
    "- Finish the symbolised sentence.\n" +
    "- Print your answer as concisely as possible.\n" +
    "- Providing only the result as a symbolized sequence of character. And show the input sentence also symbolized.\n" +
    "- Do not provide the answer in english, provide the answer in the symbolised form.\n\n";

  outputFunc(msg);

  outputFunc("Incomplete symbolized sentence:\n" + partialTokenizedSentence);
}
