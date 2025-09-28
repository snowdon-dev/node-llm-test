import { SymbolRaw } from "../interface";
import { MappingFactory, PuzzleContext, SymbolFactory } from "../PuzzleResult";
import { RandomSource } from "../random";
import { permute } from "./utils";

describe("mapping", () => {
  const sentence = "the the one";
  const sentenceWords = <readonly string[]>sentence.split(" ");
  permute(sentenceWords.map((w) => <SymbolRaw>[w])).forEach((varient, pi) => {
    Array.from({ length: 1 << 2 }, (_, i) => i).forEach((level) => {
      const random = RandomSource.SimpleSource();
      const symbols = new SymbolFactory(random, {
        multiInput: Boolean(level & (1 << 0)),
        multiTokens: Boolean(level & (1 << 1)),
      });
      const mapper = new MappingFactory();

      const context: PuzzleContext = {
        chosen: sentenceWords,
        active: [],
        otherWords: [],
        totalWordsBuckets: [sentenceWords],
        totallen: sentenceWords.length,
        minCount: sentenceWords.length,
      };
      it("works " + pi + " - " + varient.join(", ") + " - " + level, () => {
        const result = mapper.prepareMappings(symbols.buildSymbols(context));
        const realWords = Object.keys(result.tokenMap);
        expect(result.wordsSeqs.length === sentenceWords.length).toBe(true);
        const tokenArr = Object.keys(result.realMap);
        const encoded = sentenceWords.map((word) => result.tokenMap[word].str);
        const decoded = encoded.map((token) => result.realMap[token].str);
        expect(decoded.join(" ")).toBe(sentence);
        expect(tokenArr.length === realWords.length).toBe(true);
      });
    });
  });
});
