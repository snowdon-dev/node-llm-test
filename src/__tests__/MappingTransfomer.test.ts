import { SymbolRaw } from "../domain/interface";
import { PuzzleContext } from "../domain/models/PuzzleContext";
import { MappingTransformer } from "../domain/services/MappingTransformer";
import { RandomSource } from "../infra/random";
import { permute } from "./utils";

describe("MappingTransformer", () => {
  const sentence = "the the one";
  const sentenceWords = sentence.split(" ");
  permute(sentenceWords.map((w) => <SymbolRaw>[w])).forEach((varient, pi) => {
    Array.from({ length: 1 << 2 }, (_, i) => i).forEach((level) => {
      const random = RandomSource.SimpleSource(1);
      const opts = {
        multiInput: Boolean(level & (1 << 0)),
        multiTokens: Boolean(level & (1 << 1)),
      };
      const mapper = new MappingTransformer(random, opts);
      const context: PuzzleContext = {
        chosen: sentenceWords,
        active: [],
        otherWords: [],
        totalWordsBuckets: [sentenceWords],
        minCount: sentenceWords.length,
        totalWords: Array.from(new Set(sentenceWords)),
      };
      it("works " + pi + " - " + varient.join(", ") + " - " + level, () => {
        const result = mapper.create(context, 1, 1);
        const realWords = Object.keys(result.tokenMap);
        const tokenArr = Object.keys(result.realMap);
        const encoded = sentenceWords.map((word) => result.tokenMap[word].str);
        const decoded = encoded.map((token) => result.realMap[token].str);
        expect(
          realWords.some((v) => typeof v !== "string" || v.trim().length < 1),
        ).toBe(false);
        expect(
          tokenArr.some((v) => typeof v !== "string" || v.trim().length < 1),
        ).toBe(false);
        expect(decoded.join(" ")).toBe(sentence);
        expect(tokenArr.length === realWords.length).toBe(true);
      });
    });
  });

  function createForDepth() {
    class SimpleSourceImpl extends RandomSource {
      constructor(private counter: number) {
        super(
          () => this.counter++,
          (num) => num - (this.counter++ % num),
        );
      }
    }
    const random = new SimpleSourceImpl(0);
    const opts = {
      multiInput: false,
      multiTokens: false,
    };
    return new MappingTransformer(random, opts);
  }

  function createContext(words: string[]): PuzzleContext {
    return {
      chosen: words,
      active: [],
      otherWords: [],
      totalWordsBuckets: [words],
      minCount: words.length,
      totalWords: Array.from(new Set(words)),
    };
  }

  it("gets a cycle 1", () => {
    const mapper = createForDepth();
    const mapping = mapper.create(createContext(sentenceWords), 1, 0);
    expect(mapping.getToken("the").str).toBe("one");
    expect(mapping.getToken("one").str).toBe("the");
    expect(mapping.getReal("one").str).toBe("the");
    expect(mapping.getReal("the").str).toBe("one");
  });

  it("gets a cycle 2", () => {
    const mapper = createForDepth();
    const mapping = mapper.create(createContext(sentenceWords), 2, 0);
    expect(mapping.getToken("the").str).toBe("the");
    expect(mapping.getToken("one").str).toBe("one");
    expect(mapping.getReal("one").str).toBe("one");
    expect(mapping.getReal("the").str).toBe("the");
  });

  const largerSentence = "some word another word boring";
  const largerSentenceWords = largerSentence.split(" ");
  it("resolves to all tokens", () => {
    const mapper = createForDepth();
    const mapping = mapper.create(createContext(largerSentenceWords), 1, 0);
    const wordsSet = new Set(largerSentenceWords);
    const elements = Object.keys(mapping.tokenMap).concat(
      Object.keys(mapping.realMap),
    );
    expect(elements.some((e) => !wordsSet.has(e))).toBeFalsy();
    expect(Object.keys(mapping.tokenMap).length).toBe(
      Object.keys(mapping.realMap).length,
    );
    expect(Object.values(mapping.tokenMap).length).toBe(
      Object.values(mapping.realMap).length,
    );

    const usedWords = new Set();
    largerSentenceWords.forEach((word) => {
      const target = mapping.getToken(word);
      usedWords.add(target.str);
    });
    expect(usedWords.size).toBe(wordsSet.size);
  });
});
