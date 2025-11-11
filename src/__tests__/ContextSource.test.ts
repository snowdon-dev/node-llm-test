import { Context } from "node:vm";
import { ContextSource } from "../domain/reader/ContextSource";
import { SymbolMutable } from "../domain/reader/interface";

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

const createContextThreeWords = () => {
  const sentence = "the the one two";
  const sentenceWords = <readonly string[]>sentence.split(" ");
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

const createMultiBucketContext = () => {
  const sentence = "one";
  const sentenceWords = sentence.split(" ");
  return {
    chosen: sentenceWords,
    active: ["two"],
    otherWords: [],
    totalWordsBuckets: [sentenceWords],
    totallen: sentenceWords.length,
    minCount: sentenceWords.length,
    totalWords: Array.from(new Set(sentenceWords)),
  };
};

describe("ContextSource", () => {
  describe("rand not", () => {
    let source: ContextSource;

    it("works", () => {
      source = new ContextSource(createContext());
      const res = source.randNot(0, ["the"]);
      expect(res).toBe("one");
    });

    it("missing second word", () => {
      const ctx = createContext();
      source = new ContextSource(ctx);
      const excludes = ["the", "one"];
      const res = source.randNot(0, excludes);
      expect(excludes.includes(res)).toBe(true);
    });

    it("finds third word", () => {
      const ctx = createContextThreeWords();
      source = new ContextSource(ctx);
      const excludes = ["the", "one"];
      const res = source.randNot(0, excludes);
      expect(excludes.includes(res)).toBe(false);
    });
  });

  describe("basic reads", () => {
    let source: ContextSource;

    beforeEach(() => {
      source = new ContextSource(createContext());
    });

    it.skip("test peek", () => {});

    it("reads toalwords", () => {
      expect(source.atAll(0)).toBe("the");
      expect(source.atAll(1)).toBe("one");
      expect(source.all()).toStrictEqual(["the", "one"]);
    });

    it("reads one", () => {
      expect(source.isBucket("chosen")).toBe(true);
      let res = source.read(1);
      expect(res.length === 1).toBe(true);
      expect(res[0]).toBe("the");

      expect(source.next(res.length)).toBe(true);
      res = source.read(1);
      expect(res.length === 1).toBe(true);
      expect(res[0]).toBe("the");

      expect(source.next(res.length)).toBe(true);
      res = source.read(1);
      expect(res.length === 1).toBe(true);
      expect(res[0]).toBe("one");

      expect(source.next(res.length)).toBe(false);
      expect(source.isBucket("chosen")).toBe(false);

      expect(() => source.read(1)).toThrow();
    });

    it("reads all", () => {
      let res: SymbolMutable;
      const words: string[] = [];
      do {
        res = source.read(1);
        words.push(...res);
      } while (source.next(res.length));
      expect(words.join(" ")).toBe(sentence);
    });

    it("reads two", () => {
      let res = source.read(2);
      expect(res.length === 2);
      expect(res).toStrictEqual(["the", "the"]);

      expect(source.next(res.length)).toBe(true);
      res = source.read(2);
      expect(res).toStrictEqual(["one"]);

      expect(source.next(res.length)).toBe(false);
    });
  });

  describe("bucket reads", () => {
    let source: ContextSource;
    beforeEach(() => {
      source = new ContextSource(createMultiBucketContext());
    });
    it("reads one", () => {
      let res = source.read(1);
      expect(res).toStrictEqual(["two"]);
      expect(source.next(1)).toBe(false);
      res = source.read(1);
      expect(res).toStrictEqual(["one"]);
      expect(source.next(1)).toBe(false);
    });
  });
});
