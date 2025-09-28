import { SymbolFactory } from "../PuzzleResult";
import { RandomSource } from "../random";

describe("symbols", () => {
  const sentence = "the the one";
  const sentenceWords = <readonly string[]>sentence.split(" ");

  const createContext = () => {
    return {
      chosen: sentenceWords,
      active: [],
      otherWords: [],
      totalWordsBuckets: [sentenceWords],
      totallen: sentenceWords.length,
      minCount: sentenceWords.length,
    };
  };

  const createSimple = (level: number, counter: number) => {
    const random = RandomSource.SimpleSource(counter);
    const opts = {
      multiInput: Boolean(level & (1 << 0)),
      multiTokens: Boolean(level & (1 << 1)),
    };
    return new SymbolFactory(random, opts);
  };

  function* allPermutation() {
    const level = Array.from({ length: 1 << 2 }, (_, i) => i);
    const counter = Array.from({ length: 2 }, (_, i) => i);
    for (let l = 0; l < level.length; l++) {
      for (let c = 0; c < counter.length; c++) {
        yield { level: level[l], counter: counter[c] };
      }
    }
  }

  it("works", () => {
    const symbols = createSimple(2, 1);
    const context = createContext();
    const result = symbols.buildSymbols(context);
    expect(result !== undefined).toBeTruthy();
    const tokenSet = new Set(result.tokens);
    const wordsSet = new Set(result.totalSymbols);
    expect(result.tokens.length === result.totalSymbols.length).toBeTruthy();
    expect(tokenSet.size === wordsSet.size).toBeTruthy();
  });

  describe("permutations", () => {
    for (const { level, counter } of allPermutation()) {
      it("works: " + level.toString(2) + " - " + counter, () => {
        const symbols = createSimple(level, counter);
        const context = createContext();
        const result = symbols.buildSymbols(context);
        expect(result !== undefined).toBeTruthy();

        const tokenSet = new Set(result.tokens);
        const wordsSet = new Set(result.totalSymbols);
        expect(
          result.tokens.length === result.totalSymbols.length,
        ).toBeTruthy();
        expect(tokenSet.size === wordsSet.size).toBeTruthy();
      });
    }
  });
});
