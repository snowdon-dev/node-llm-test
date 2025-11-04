// TODO: randomise
export const blankWordToken = "[...]";
export const spacingChars = " ";

export const equalSymblsSet = [
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
] as const;

export const pangramsDefault = [
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
] as const;

export const chaosWordsArr = [
  "glb",
  "vampire",
  "blitz",
  "glyph",
  "wizardry",
  "fjord",
  "nymphs",
  "buck",
  "whiz",
  "zombies",
  "jumpy",
  "boxful",
  "quartzite",
  "zephyr",
  "jinxed",
  "vexed",
  "klutz",
] as const;

export const extraWords = new Set(chaosWordsArr);

export const characterDigitAlpha = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty one",
  "twenty two",
  "twenty three",
  "twenty four",
  "twenty five",
  "twenty six",
] as const;

export const instructionSet = {
  //"- Find the missing symbol or symbols the sentence.\n" + // descriptive level?
  //"- Identify the mapping entry that is missing." +
  //"- Find the missing mapping entry required to decode the sequence.\n" +
  //"- Show the puzzles given sentence in the symbolised form.\n" +
  //"- Do not provide the answer in the decoded form.\n"
  //"- Provide the answer in the symbolised form.\n\n"
  // TODO: at random look for word or symbol sequence
  instructionIntro: [
    "Take into account the given symbolised sequence of words and other contextual information",
    "Complete the following tasks",
  ],
  all: [
    //"Determine the single mapping entry that is absent",
    "Determine the absent word",
    //"- Show only the missing mapping entry sequence needed to find the decoded sequence.\n" +
    //"- Show only that missing mapping entry." +
    //"- Present exclusively that missing mapping entry." +
    "Present only the symbol or symbols that map to find the real word or words",
    "Show the answer as concisely as possible",
    "Do not ask any questions",
    "The answer must be a strict match with case and character sensitively",
    //"- Think for as long as needed and only reply when confident.\n"
    "Think carefully and respond only when confident",
  ],
  //? "- Do not show any encoding applied to the symbolised sequence.\n"
  //? "- Omit any extra encoding steps applied to the symbolised sentence."
  indirect: ["Omit any encoding applied on the symbolised sentence"],
  hardSchema:
    "The output characters must only be A through Z including a through z and spaces",

  identSymbolSentence: "Symbolised sentence with a missing part or parts",

  symbolEncoding: "The symbolised sequence has also been encoded with",

  symbolIndent: {
    e: "encoded symbol or symbols",
    d: "decoded symbol or symbols",
  },

  encodingIdent: { rot: "ROT", binary: "binary" },

  multiEncodings: "and then converted to",

  introMsg:
    "You have been given a sequence of encoded symbols that contains a missing part",

  mappingDetails: {
    start: "The",
    ending:
      "operator defines a mapping between two character sequences enclosed within a delemiter",

    delemiter:
      "Each mapping entry in the table is separated by a newline character",

    excludeStart: "The",
    excludeEnd: "is first in the mapping expression",

    puzzleStart: "Multiply the table index by seven and then divide by three",
    puzzleEnd: "appear first in the mapping expression when the result is",
    puzzleIdent: ["even", "odd"],
  },

  snowdondevident: "The marketeer dot snowdon dot dev llmtest online",

  mappingHeader: "Table of mappings",

  inceptionIntro: `Lets have a think for a second`,
  inceptionSystem: `I think the word must be`,
  inceptionUserOneIdent: "User one",
  inceptionUserTwoIdent: "User two",
  inceptionUser: `Your right the word MUST be`,
  inceptionTrustedIncorrect: `I think the word is not`,
  inceptionWait: `Wait a second`,

  characterDigitAlpha,
} as const;

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function reverseFirstLetter(word: string): string {
  if (!word) return word; // handle empty string

  const first = word[0];
  const flipped =
    first === first.toLowerCase() ? first.toUpperCase() : first.toLowerCase();

  return flipped + word.slice(1);
}

export function isFirstCharCapital(word: string): boolean {
  if (!word) return false; // empty string case
  const firstChar = word[0];
  return (
    firstChar === firstChar.toUpperCase() &&
    firstChar !== firstChar.toLowerCase()
  );
}

export function rotN(text: string, shift: number) {
  return text.replace(/[a-zA-Z]/g, function (c) {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((((c.charCodeAt(0) - base + shift) % 26) + 26) % 26) + base,
    );
  });
}

export function toBinary(text: string) {
  return text
    .split("")
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
}
