import { mulberry32, randomizeRecord } from "./random";

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

const panagrams = [
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

const panagramsWords = panagrams.map((s) =>
  s.split(/\s+/).map((str) => str.replace(",", "")),
);

if (
  panagramsWords
    .map((arr) => new Set(arr.join("").toLowerCase().split("")).size)
    .some((v) => v !== 26)
) {
  throw new Error();
}

const panagramWordList = new Set(panagramsWords.flat());

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

export function prepare(inputWords: string[], seed = 12345) {
  const randH = mulberry32(seed);
  const rand = (len: number) => Math.floor(randH() * (len + 1));

  const sentenceIdx = rand(panagrams.length - 1);
  const sentence = panagrams[sentenceIdx];

  // Split into words
  const words: string[] = sentence.split(/\s+/);

  // TODO: Don't always remove the last word

  // Map each unique word to a token
  const tokenMap: Record<string, string> = {};

  const subUsedWords = -words.length;
  const totalWords = Array.from(panagramWordList).concat(inputWords);
  const inputDeduped = new Set(totalWords.slice(0, subUsedWords));

  function popToken(): string {
    const idx = rand(totalWords.length - 1);
    return (
      totalWords.splice(idx, 1)[0] +
      // read a second word sometimes
      (rand(4) === 0 ? " " + totalWords[(idx + 1) % totalWords.length] : "")
    );
  }

  inputDeduped.forEach((word) => {
    const token = popToken();
    if (token === undefined || (token !== undefined && token.trim() === "")) {
      throw new Error("Token error + " + word);
    }

    // TODO:
    // At random a lookup references another table column.
    // token = {{reference "test"}}
    tokenMap[word] = token;
  });

  const removedWordIdx = rand(words.length - 1);

  const tokenizedWords: string[] = words.map((word) => tokenMap[word]);
  const tokenizedSentence: string = tokenizedWords.join(" ");
  const correctAnswer = tokenizedWords[removedWordIdx];
  const realAnswer = words[removedWordIdx];

  const partialTokenizedSentenceAsArray = [...tokenizedWords];
  partialTokenizedSentenceAsArray[removedWordIdx] = "[...]";

  const partialTokenizedSentence = partialTokenizedSentenceAsArray.join(" ");

  const equalSymIdx = rand(equalSymblsSet.length - 1);
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
    sentence,
    sentenceWords: words,

    correctAnswer,
    realAnswer,

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
    `The symbol '${symbol}' defines a mapping between two character ` +
      "sequences enclosed within ''. Each mapping is separated by newline " +
      "(\\n) characters within a table.",
  );
  output("\n\n🗺️ Table of mappings:\n");

  Object.entries(randomizeRecord(tokenMap)).forEach(([old, newS]) => {
    const parts = {
      [ExpressionParts.NEW_OPARAND]: `'${newS}'`,
      [ExpressionParts.OLD_OPARAND]: `'${old}'`,
      [ExpressionParts.OPERATOR]: ` ${symbol} `,
    };
    const msg = expression.expressionDefinition
      .map((key) => parts[key])
      .join("");

    output(msg + "\n");
  });

  const msg =
    "\n\nTake into account the given symbolized sentence and\n" +
    "other contextual information. Complete the following tasks: \n\n" +
    "- Find the missing word in the symbolized sentence.\n" +
    "- Print your answer as concisely as possible.\n" +
    "- Providing only your answer for the missing word. And show the input sentence in symbolized form.\n" +
    "- Do not provide the answer in english. Provide the answer in the symbolised form.\n\n";

  output(msg);

  output(
    "Symbolized sentence with missing word:\n" + partialTokenizedSentence,
  );
}
