
// TODO: randomise
export const blankWordToken = "[...]";

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
];

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
];

export const chaosWords = new Set([
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
]);



export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
