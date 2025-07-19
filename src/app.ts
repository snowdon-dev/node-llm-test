import {
  pangramsDefault,
  blankWordToken,
  chaosWords,
  equalSymblsSet,
} from "./characters";
import {
  ExpressionDefinitionType,
  ExpressionPart,
  IExpressionResult,
  ILLMTest,
} from "./interface";
import { IPrepareResult } from "./interface";
import { Feature, hasFeature, Presets } from "./levels";
import { getRandomOrder, mulberry32, randomizeRecord } from "./random";

interface IAnswerContext {
  tokenMap: Record<string, string>;
  realMap: Record<string, string>;

  partialWords: string[];

  correctAnswer: string;
}

const validateLevel = (i: number) => {
  if (!(i >= 0 && i <= 15)) {
    throw new TypeError("invalid level");
  }
};

const validatePangrans = (list: string[]) => {
  if (!(list.length >= 1)) {
    throw new TypeError("invalid pangram list");
  }
};

const validateSeed = (num: number) => {
  if (!(num > 0 && num <= 2 ** 31 - 1)) {
    throw new Error("Invalid seed number");
  }
};

export class Puzzle implements ILLMTest {
  public readonly result: Readonly<IPrepareResult>;

  static New = (
    inputWords: null|string[] = [],
    seed: null|number = 12345,
    pangrams: undefined|string[] = pangramsDefault,
    level: Presets.MAX,
  ) => new Puzzle(inputWords, seed, pangrams, level);

  /**
   * @param inputWords A list of words to be appended into a word list of the
   * language
   * @param seed A unique seed to preserve determinism or null to use Math.random.
   * @param panagrams A list of pangrams to select from
   * @param level The hardness of the game
   */
  private constructor(
    private readonly inputWords: string[],
    private readonly seed: number,
    private readonly pangrams: string[],
    private readonly level: number,
  ) {
    validateLevel(level);
    validatePangrans(pangrams);
    validateSeed(seed);
    this.result = this.prepare();
  }

  private prepare() {
    return prepare(this.inputWords, this.seed, this.pangrams, this.level);
  }

  public print(output: (...outs: string[]) => unknown) {
    return print(
      this.result.partialTokenizedSentence,
      this.result.tokenMap,
      this.result.expression,
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

function preapreTotalWords(
  level: number,
  inputWords: string[],
  sentenceIdx: number,
  pangrams: string[],
  words: string[],
) {
  const wordsSet = new Set(words);

  // Map each unique word to a token
  const totalWords = new Set<string>();
  for (let i = 0; i < inputWords.length; i++) {
    totalWords.add(inputWords[i]);
  }

  if (hasFeature(level, Feature.CHAOS_WORDS)) {
    // Add words that are intended to cause chaos
    for (let i = 0; i < pangrams.length; i++) {
      if (i === sentenceIdx) {
        continue;
      }
      const pangramSentence = pangrams[i];
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
      if (!wordsSet.has(elm)) {
        totalWords.add(elm);
      }
      // TODO: uppercase case word - remove maybe
      //totalWords.add(capitalizeFirstLetter(elm));
    }
  }

  const nPWordsPar = totalWords.size;

  for (let i = 0; i < words.length; i++) {
    totalWords.add(words[i]);
  }

  return { totalWords, nPWordsPar };
}

function prepareMappings(
  rand: (num: number) => number,
  level: number,
  totalWords: Set<string>,
  nPWordsPar: number,
) {
  const inputDeduped = Array.from(totalWords);
  const randomArr = getRandomOrder(inputDeduped.slice(), rand);
  const tokenMap: Record<string, string> = {};
  const realMap: Record<string, string> = {};

  function popToken(multi = false): string[] {
    // Token without duplicates
    const tmptoken = randomArr.pop();

    if (
      tmptoken === undefined ||
      (tmptoken !== undefined && tmptoken.trim() === "")
    ) {
      throw new Error("Token pop error");
    }
    if (!multi) {
      return [tmptoken];
    }

    // Read a second (possible duplicate) word sometimes
    const secondtoken = inputDeduped[rand(inputDeduped.length - 1)];

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

  // can't read a word thats at set end
  function withinMultizeBounds(idx: number, partEnd: number) {
    return !(idx >= partEnd - 2 && idx === partEnd - 1);
  }

  function buildMappings(idx: number, partEnd: number) {
    const useMultI = hasFeature(level, Feature.MULTIZE_I_TOKENS);
    const useSecond = hasFeature(level, Feature.MULTIZE_TOKENS);
    const bothSidesMulti = useMultI && useSecond;

    const sWordRoll = rand(4) > 2;
    const multiWordRoll =
      useMultI && rand(4) > 2 ? withinMultizeBounds(idx, partEnd) : false;

    // no second token when miltiI, and off roll
    // or random when multi tokens
    let multiToken: boolean;
    if (bothSidesMulti) {
      multiToken = !multiWordRoll ? sWordRoll : false;
    } else if (useSecond) {
      multiToken = sWordRoll;
    } else if (useMultI) {
      multiToken = false;
    }

    const token = popToken(multiToken);
    const tokenStr = token.join(" ");
    const word = inputDeduped[idx];

    let tokenItems = [tokenStr];
    let reads = 1;
    let words = [word];

    if (multiWordRoll) {
      // sometimes takes two words
      const nextWord = inputDeduped[idx + 1];
      words.push(nextWord);
      reads++;

      // if multiI but not multi, read a second token
      const mtw = `${word} ${nextWord}`;
      let mtt = `${token}`;
      if (useSecond && sWordRoll) {
        const nextToken = popToken()[0];
        const nextTokenStr = nextToken;
        mtt += ` ${nextTokenStr}`;
        tokenItems = [mtt];
      }
      tokenMap[mtw] = mtt;
      realMap[mtt] = mtw;
    } else {
      tokenMap[word] = tokenStr;
      realMap[tokenStr] = word;
    }

    return { tokenItems, reads, words };
  }

  // for only non pangram words
  for (let debupedIdx = 0; debupedIdx < nPWordsPar; debupedIdx++) {
    const info = buildMappings(debupedIdx, nPWordsPar);
    debupedIdx += info.reads - 1;
  }

  // insert the sentence words
  const tokenizedSequenceWords = [];
  const tokenRefsToWords: Record<string, string[]> = {};

  let wordStartIdx = 0;
  for (let npwi = nPWordsPar; npwi < inputDeduped.length; npwi++) {
    const info = buildMappings(npwi, inputDeduped.length);
    tokenizedSequenceWords.push(...info.tokenItems);
    info.tokenItems.forEach((w) => (tokenRefsToWords[w] = info.words));
    npwi += info.reads - 1;
    wordStartIdx++;
  }

  return {
    tokenMap,
    realMap,

    tokenRefsToWords,

    tokenizedSequenceWords,
  };
}

function buildExpresion(rand: (num: number) => number): IExpressionResult {
  // Build an expression
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
  return {
    expressionDefinition: expressionDefinition,
    expressionType,
    equalSymbol,
  };
}

export function prepare(
  inputWords: string[],
  seed: number = 12345,
  pangrams = pangramsDefault,
  level = 0,
): IPrepareResult {
  const randH = seed !== null ? mulberry32(seed) : Math.random;
  const rand = (len: number) => Math.floor(randH() * (len + 1));

  const sentenceIdx = rand(pangrams.length - 1);
  const sentence = pangrams[sentenceIdx];
  const words: string[] = sentence.split(/\s+/);

  const expression = buildExpresion(rand);

  const { totalWords, nPWordsPar } = preapreTotalWords(
    level,
    inputWords,
    sentenceIdx,
    pangrams,
    words,
  );
  const {
    tokenMap,
    realMap,
    tokenizedSequenceWords,
    tokenRefsToWords,
  } = prepareMappings(rand, level, totalWords, nPWordsPar);
  
  const tokenRefEntries = Object.entries(tokenRefsToWords);
  const tokenRefRemoveIdx = rand(tokenRefEntries.length - 1);
  let missingWordIdx = -1;
  let tokIdx = -1;
  for (const [_, tok] of tokenRefEntries) {
    tokIdx++;
    if (tokIdx === tokenRefRemoveIdx) {
      // we use the first word, the left word of a multi
      missingWordIdx++;
      break;
    }
    missingWordIdx += tok.length;
  }

  const correctAnswer = tokenizedSequenceWords[tokIdx];
  const realAnswer = words[missingWordIdx];

  if ([correctAnswer, realAnswer].includes(undefined)) {
    throw new Error("Mapping failure");
  }

  const partialTokenizedWords = [...tokenizedSequenceWords];
  partialTokenizedWords[tokIdx] = blankWordToken;
  const partialWords = [...words];
  partialWords[missingWordIdx] = blankWordToken;
  const partialTokenizedSentence = partialTokenizedWords.join(" ");
  const tokenizedSentence = tokenizedSequenceWords.join(" ");

  const res = {
    realMap,
    tokenMap,

    tokenizedWords: tokenizedSequenceWords,
    tokenizedSentence,
    partialTokenizedSentence,
    //partialTokenizedWords,

    sentence,
    sentenceWords: words,
    partialWords,

    correctAnswer,
    realAnswer,

    expression,
  };

  return res;
}

/**
 * - read a single answer
 * - If the characters are a word and its letters complete the alphabet
 *
 * token    => word seq       (curent missing = brown) (no single for brown)
 * one two  => quick brown    answer tokens: one two
 *
 * TODO: multi-words - if we are given lots of words, parse out the answer
 */
export function answer(
  strIn: string,
  context: Readonly<IAnswerContext>,
) {
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
      return {exact: false, possible: false};
    }
    if (context.tokenMap[wordSequence] === undefined) {
      return {exact: false, possible: false};
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
      return {exact: false, possible: false};
    }

    // TODO: word or Word - if removedWordIdx = 0, then its real need to start
    // with a capital. Unless i remove capitals
    // code >= 65 && code <= 90

    // not true, but potentially true
    return {exact: false, possible: true, possibleReal: wordSequence};
  }
  throw Error("Answer failure");
}

export function getInitialDescription(
  symbol: string,
  expressionDefinition: ExpressionPart[],
  excludeMappingInfo: boolean = false,
): string {
  const order = expressionDefinition
    .map((item) => {
      switch (item) {
        case ExpressionPart.NEW_OPARAND:
          return "encoded symbol";
        case ExpressionPart.OLD_OPARAND:
          return "decoded symbol";
        case ExpressionPart.OPERATOR:
          return null;
      }
    })
    .filter((v) => v !== null);

  return (
    // remove? too descriptive
    //"The following describes a puzzle. " +
    //"To complete the game you must figure out the missing word, without asking any questions.\n\n" +
    // By providing this information, you give the LLM the knowledge to preform
    // preform a direct lookup, instead of having to buffer two sentences and
    // select the sentence
    "You will be given a sentence that contains missing word, and the sentence been encoded into a symbolised form.\n" +
    `The '${symbol}' operator defines a mapping between two character sequences enclosed in single quotes.` +
    "\nEach mapping entry in the table is separated by a newline " +
    "(\\n) character." +
    (excludeMappingInfo
      ? "\n"
      : `\nThe ${order[0]} characters comes first in the mapping expression.`)
  );
}

export function getTableMappingHeader(): string {
  return "\n\nTable of mappings:";
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
  // this could be memorised
  return (
    "\n\nTake into account the given symbolised sequence of words and\n" +
    "other contextual information. Complete the following tasks: \n\n" +
    //"- Find the missing word in the sentence.\n" + // could remove?
    "- Provide the symbol or symbols required to decode the sentence.\n" +
    "- Show the answer as concisely as possible.\n"
    //"- Show the puzzles given sentence in the symbolised form.\n" +
    //"- Do not provide the answer in the decoded form.\n"
    //"- Provide the answer in the symbolised form.\n\n"
    // TODO: at random look for word or symbol sequence
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
  level: number,
  output: (outs: string) => void,
) {
  const symbol = expression.equalSymbol;

  output(
    getInitialDescription(
      symbol,
      expression.expressionDefinition,
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
