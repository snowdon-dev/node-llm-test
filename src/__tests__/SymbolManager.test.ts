import { PuzzleContext } from "../domain/models/PuzzleContext";
import { ContextSource } from "../domain/reader/ContextSource";
import { SymbolManager } from "../domain/reader/SymbolManager";
import { RandomSource } from "../infra/random";

describe("SymbolManager", () => {
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
      totalWords: Array.from(new Set(sentenceWords)),
    };
  };

  const createActive = () => {
    const active = ["two", "not", "not"];
    const activeset = Array.from(new Set(active));
    return {
      chosen: sentenceWords,
      active,
      otherWords: [],
      totalWordsBuckets: [sentenceWords],
      totallen: sentenceWords.length,
      minCount: sentenceWords.length,
      totalWords: Array.from(new Set(sentenceWords)).concat(activeset),
    };
  };

  const createActiveInput = () => {
    const activeList = ["two", "not", "not"];
    const otherWords = ["another", "foo"];
    const activeset = Array.from(new Set(activeList));
    return {
      chosen: sentenceWords,
      active: activeList,
      otherWords,
      totalWordsBuckets: [sentenceWords, activeList, otherWords],
      totallen: sentenceWords.length,
      minCount: sentenceWords.length,
      totalWords: Array.from(new Set(sentenceWords)).concat(
        otherWords,
        activeset,
      ),
    };
  };

  const createInput = () => {
    const otherWords = ["another", "foo"];
    return {
      chosen: sentenceWords,
      active: [],
      otherWords,
      totalWordsBuckets: [sentenceWords, otherWords],
      totallen: sentenceWords.length,
      minCount: sentenceWords.length,
      totalWords: Array.from(new Set(sentenceWords)).concat(otherWords),
    };
  };

  const createInvalidInputContext = () => {
    return {
      chosen: sentenceWords,
      active: [],
      otherWords: ["one", "one"],
      totalWordsBuckets: [sentenceWords],
      totallen: sentenceWords.length,
      minCount: sentenceWords.length,
      totalWords: Array.from(new Set(sentenceWords)),
    };
  };

  const createSimple = (ctx: PuzzleContext, level: number, counter: number) => {
    const random = RandomSource.SimpleSource(counter);
    const opts = {
      multiInput: Boolean(level & (1 << 0)),
      multiTokens: Boolean(level & (1 << 1)),
    };
    const source = new ContextSource(ctx);
    return SymbolManager.New(random, source, opts);
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
    const context = createContext();
    const symbols = createSimple(context, 0, 0);
    const result = symbols.run(0);
    expect(result !== undefined).toBeTruthy();
    const tokenSet = new Set(result.tokens);
    expect(tokenSet.size === 2);
    const wordsSet = new Set(result.totalSymbols);
    expect(result.tokens.length === result.totalSymbols.length).toBeTruthy();
    expect(tokenSet.size === wordsSet.size).toBeTruthy();
  });

  it("works 2", () => {
    const symbols = createSimple(createActiveInput(), 1, 0);
    const result = symbols.run(0);
    expect(result !== undefined).toBeTruthy();
    const tokenSet = new Set(result.tokens);
    expect(tokenSet.size === 2);
    const wordsSet = new Set(result.totalSymbols);
    expect(result.tokens.length === result.totalSymbols.length).toBeTruthy();
    expect(tokenSet.size === wordsSet.size).toBeTruthy();
  });

  it.skip("fails when other words contains dupes", () => {
    const context = createInvalidInputContext();
    const symbols = createSimple(context, 2, 1);
    const result = symbols.run(0);
    expect(result !== undefined).toBeTruthy();
    expect(result.tokens.length === result.totalSymbols.length).toBeFalsy();
  });

  describe("permutations", () => {
    for (const { level, counter } of allPermutation()) {
      it("works: " + level.toString(2) + " - " + counter, () => {
        const context = createContext();
        const symbols = createSimple(context, level, counter);
        const result = symbols.run(0);
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

  const contexts = [createActiveInput, createActive, createInput];
  for (const contextFn of contexts) {
    for (const { level, counter } of allPermutation()) {
      it(
        "works with context" +
          contextFn.name +
          " - " +
          +level.toString(2) +
          " - " +
          counter,
        () => {
          const context = contextFn();
          const symbols = createSimple(context, level, counter);
          const result = symbols.run(0);
          expect(result !== undefined).toBeTruthy();

          const tokenSet = new Set(result.tokens);
          const wordsSet = new Set(result.totalSymbols);
          expect(
            result.tokens.length === result.totalSymbols.length,
          ).toBeTruthy();
          expect(tokenSet.size === wordsSet.size).toBeTruthy();
        },
      );
    }
  }
});

// TODO: test placement index
