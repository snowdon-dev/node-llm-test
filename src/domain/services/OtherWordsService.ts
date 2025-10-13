import {
  reverseFirstLetter,
  extraWords,
  capitalizeFirstLetter,
} from "../characters";

export class OtherWordsService {
  constructor(
    private readonly options: Readonly<{
      chaosWords: boolean;
      extraWords: boolean;
    }>,
  ) {}

  public build(
    input: readonly (readonly string[])[],
    pangramsWordsList: readonly string[] | undefined,
    words: readonly string[],
  ) {
    const activeBuckets = [words, pangramsWordsList].filter(
      (v) => v !== void 0,
    );
    const excludeWordsSet = new Set(activeBuckets.flat());
    const otherWords = new Set<string>();
    for (let j = 0; j < input.length; j++) {
      for (let i = 0; i < input[j].length; i++) {
        if (!excludeWordsSet.has(input[j][i])) {
          otherWords.add(input[j][i]);
        }
        if (this.options.chaosWords) {
          const other = reverseFirstLetter(input[j][i]);
          if (!excludeWordsSet.has(other)) {
            otherWords.add(other);
          }
        }
      }
    }
    if (this.options.extraWords) {
      for (let elm of extraWords) {
        const lower = elm.toLowerCase();
        if (!excludeWordsSet.has(lower)) {
          otherWords.add(lower);
        }
        if (this.options.chaosWords) {
          const upper = capitalizeFirstLetter(lower);
          if (!excludeWordsSet.has(upper)) {
            otherWords.add(upper);
          }
        }
      }
    }

    if (this.options.chaosWords && pangramsWordsList) {
      for (let i = 0; i < pangramsWordsList.length; i++) {
        const word = reverseFirstLetter(pangramsWordsList[i]);
        if (!excludeWordsSet.has(word)) {
          otherWords.add(word);
        }
      }
    }

    if (this.options.chaosWords) {
      for (let i = 0; i < words.length; i++) {
        const reversed = reverseFirstLetter(words[i]);
        if (!excludeWordsSet.has(reversed)) {
          otherWords.add(reversed);
        }
      }
    }

    return otherWords as ReadonlySet<string>;
  }
}
