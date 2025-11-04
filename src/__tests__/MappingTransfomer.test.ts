import { SymbolRaw } from "../domain/interface";
import { PuzzleContext } from "../domain/models/PuzzleContext";
import { MappingTransformer } from "../domain/services/MappingTransformer";
import { RandomSource } from "../infra/random";
import { permute } from "./utils";

describe("MappingTransformer", () => {
  const sentence = "the the one";
  const sentenceWords = <readonly string[]>sentence.split(" ");
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
        const result = mapper.create(context);
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
});
