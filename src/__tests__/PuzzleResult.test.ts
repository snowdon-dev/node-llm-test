import { IPrepareResult, ISymbols } from "../domain/interface";
import { PuzzleResult } from "../domain/models/PuzzleResult";

function createISymbol(words: string): ISymbols {
  const [first, second] = words.split(" ");
  return {
    str: words,
    els: [first, second].filter((v) => v !== void 0) as
      | [string]
      | [string | string],
  };
}

describe("PuzzleResult", () => {
  const multiTokenContext: Partial<PuzzleResult> = {
    getToken(str: string) {
      return this.tokenMap[str];
    },
    getReal(str: string) {
      return this.realMap[str];
    },
    tokenMap: {
      Grumpy: createISymbol("wizards make"),
      wizards: createISymbol("make"),
      make: createISymbol("toxic and"),
      toxic: createISymbol("queen"),
      brew: createISymbol("the"),
      for: createISymbol("evil"),
      the: createISymbol("and"),
      evil: createISymbol("for Grumpy"),
      queen: createISymbol("Jack"),
      and: createISymbol("brew"),
      Jack: createISymbol("Grumpy for"),
    },
    realMap: {
      "wizards make": createISymbol("Grumpy"),
      make: createISymbol("wizards"),
      "toxic and": createISymbol("make"),
      queen: createISymbol("toxic"),
      the: createISymbol("brew"),
      evil: createISymbol("for"),
      and: createISymbol("the"),
      "for Grumpy": createISymbol("evil"),
      Jack: createISymbol("queen"),
      brew: createISymbol("and"),
      "Grumpy for": createISymbol("Jack"),
    },
    partialWords: [
      "Grumpy",
      "wizards",
      "[...]",
      "toxic",
      "brew",
      "for",
      "the",
      "evil",
      "queen",
      "and",
      "Jack",
    ],
    sentenceWords: [
      "Grumpy",
      "wizards",
      "make",
      "toxic",
      "brew",
      "for",
      "the",
      "evil",
      "queen",
      "and",
      "Jack",
    ],
    correctAnswer: "toxic and",
  };

  const createArgs = (input: Partial<IPrepareResult>) => {
    return Object.assign({}, input) as IPrepareResult;
  };
  const createPuzzle = (input: Partial<IPrepareResult>) => {
    return new PuzzleResult(createArgs(input));
  };

  it("answers exact multi answer", () => {
    const puzzle = createPuzzle(multiTokenContext);
    const result = puzzle.answer("toxic and");
    expect(result.exact).toBe(true);
  });

  const multiRealWords = {
    getToken(str: string) {
      return this.tokenMap[str];
    },
    getReal(str: string) {
      return this.realMap[str];
    },
    tokenMap: {
      "Just keep": createISymbol("keep examining"),
      examining: createISymbol("for"),
      "every low": createISymbol("zinc low"),
      "bid quoted": createISymbol("bid etchings"),
      for: createISymbol("quoted"),
      "zinc etchings": createISymbol("every Just"),
    },
    realMap: {
      "keep examining": createISymbol("Just keep"),
      for: createISymbol("examining"),
      "zinc low": createISymbol("every low"),
      "bid etchings": createISymbol("bid quoted"),
      quoted: createISymbol("for"),
      "every Just": createISymbol("zinc etchings"),
    },
    partialWords: [
      "Just",
      "keep",
      "examining",
      "every",
      "low",
      "bid",
      "quoted",
      "for",
      "[...]",
      "etchings",
    ],
    sentenceWords: [
      "Just",
      "keep",
      "examining",
      "every",
      "low",
      "bid",
      "quoted",
      "for",
      "zinc",
      "etchings",
    ],
    correctAnswer: "every Just",
  };

  it("answers exact multi real words", () => {
    const puzzle = createPuzzle(multiRealWords);
    const res = puzzle.answer("every Just");
    expect(res.exact).toBe(true);
    const res2 = puzzle.answer("every");
    expect(res2.exact).toBe(false);
    expect(res2.possible).toBe(false);
  });

  const multiRealWordsNotExpected = {
    getToken(str: string) {
      return this.tokenMap[str];
    },
    getReal(str: string) {
      return this.realMap[str];
    },
    // missing word is zinc
    tokenMap: {
      "Just keep": createISymbol("keep examining"),
      examining: createISymbol("for"),
      "every low": createISymbol("zinc low"),
      "bid quoted": createISymbol("bid etchings"),
      for: createISymbol("quoted"),
      "zinc etchings": createISymbol("every Just"),
      // extra char
      "zzinc eetchings": createISymbol("test test"),
    },
    realMap: {
      "keep examining": createISymbol("Just keep"),
      for: createISymbol("examining"),
      "zinc low": createISymbol("every low"),
      "bid etchings": createISymbol("bid quoted"),
      quoted: createISymbol("for"),
      "every Just": createISymbol("zinc etchings"),
      // extra char
      "test test": createISymbol("zzinc eetchings"),
    },
    partialWords: [
      "Just",
      "keep",
      "examining",
      "every",
      "low",
      "bid",
      "quoted",
      "for",
      "[...]",
      "etchings",
    ],
    sentenceWords: [
      "Just",
      "keep",
      "examining",
      "every",
      "low",
      "bid",
      "quoted",
      "for",
      "zinc",
      "etchings",
    ],
    correctAnswer: "every Just",
  };
  it("answers multi real words not expected", () => {
    const puzzle = createPuzzle(multiRealWordsNotExpected);
    const res = puzzle.answer("test test");
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(true);
  });

  const multiTokenNotExpectedContext = {
    getToken(str: string) {
      return this.tokenMap[str];
    },
    getReal(str: string) {
      return this.realMap[str];
    },
    tokenMap: {
      Jackdaws: createISymbol("Jackdaws"),
      love: createISymbol("sphinx"),
      my: createISymbol("love quartz"),
      big: createISymbol("big Jackdaws"),
      bigg: createISymbol("test test"),
      sphinx: createISymbol("quartz big"),
      of: createISymbol("my"),
      quartz: createISymbol("of"),
    },
    realMap: {
      Jackdaws: createISymbol("Jackdaws"),
      sphinx: createISymbol("love"),
      "love quartz": createISymbol("my"),
      "big Jackdaws": createISymbol("big"),
      "test test": createISymbol("bigg"),
      "quartz big": createISymbol("sphinx"),
      my: createISymbol("of"),
      of: createISymbol("quartz"),
    },
    partialWords: ["Jackdaws", "love", "my", "[...]", "sphinx", "of", "quartz"],
    sentenceWords: ["Jackdaws", "love", "my", "big", "sphinx", "of", "quartz"],
    correctAnswer: "big Jackdaws",
  };

  it("answers multi token words not expacted", () => {
    const puzzle = createPuzzle(multiRealWordsNotExpected);
    const res = puzzle.answer("test test");
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(true);
  });

  it("answers false for duplicate multi token word", () => {
    const puzzle = createPuzzle(multiTokenNotExpectedContext);
    const res = puzzle.answer("quartz big");
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(false);
  });
});
