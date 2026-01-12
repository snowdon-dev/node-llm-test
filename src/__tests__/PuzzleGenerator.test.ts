import { RandomSource } from "../infra/random";
import { MappingTransformer } from "../domain/services/MappingTransformer";
import { PuzzleContext } from "../domain/models/PuzzleContext";
import { enumFlagsToBooleans, Feature, levelMax } from "../domain/levels";
import { IPrepareResult, ISymbols } from "../domain/interface";

import { pangramsDefault } from "../domain/characters";

import {
  chooseRemoveIndex,
  PuzzleGenerator,
} from "../domain/services/PuzzleGenerator";
import { PuzzleContextFactory } from "../domain/PuzzleContextFactory";
import { OtherWordsService } from "../domain/services/OtherWordsService";
import { PuzzlePlanBuilder } from "../domain/services/PuzzlePlanBuilder";

type CreateReturnType = ReturnType<MappingTransformer["create"]>;

const puzzleContextFactoryMock = {
  create(): PuzzleContext {
    return {
      chosen: ["one", "two"],
      active: [],
      otherWords: [],
      totalWordsBuckets: [],
      totalWords: ["one", "two"],
      minCount: 2,
    };
  },
};
const transfomerMock = {
  create(): CreateReturnType {
    const wordsSeqs: ISymbols[] = [
      { els: ["one"], str: "one" },
      { els: ["two"], str: "two" },
    ];
    const tokenMap: Record<string, ISymbols> = {
      one: wordsSeqs[1],
      two: wordsSeqs[0],
    };
    const realMap: Record<string, ISymbols> = {
      one: wordsSeqs[1],
      two: wordsSeqs[0],
    };
    const tokenEntries: [string, ISymbols][] = [
      ["one", wordsSeqs[1]],
      ["two", wordsSeqs[0]],
    ];
    return {
      tokenEntries,
      wordsSeqs,
      tokenMap,
      realMap,
      getToken: (str: string) => {
        return tokenMap[str];
      },
      getReal: (str: string) => {
        return realMap[str];
      },
    };
  },
};

function testResultStructure(result: IPrepareResult) {
  expect(result).toHaveProperty("tokenMap");
  expect(result).toHaveProperty("realMap");
  expect(result).toHaveProperty("getToken");
  expect(result).toHaveProperty("getReal");

  expect(result).toHaveProperty("tokenizedWords");
  expect(result).toHaveProperty("tokenizedSentence");
  expect(result).toHaveProperty("partialTokenizedSentence");
  expect(result).toHaveProperty("partialTokenizedWords");

  expect(result).toHaveProperty("sentence");
  expect(result).toHaveProperty("sentenceWords");
  expect(result).toHaveProperty("partialWords");

  expect(result).toHaveProperty("wordsSeqs");
  expect(result).toHaveProperty("correctAnswer");
  expect(result).toHaveProperty("realAnswer");

  expect(result).toHaveProperty("expression");
  expect(result).toHaveProperty("symbolExpression");

  expect(result).toHaveProperty("testComplex");
  expect(result).toHaveProperty("instructionWords");
}

describe("puzzle generator", () => {
  describe("chooseRemoveIndex", () => {
    it("lowers values > minIndex", () => {
      const totalPosition = 4;
      const minIndex = 3;
      const res = chooseRemoveIndex(totalPosition, minIndex, () => 1);
      expect(res).toBe(1);
    });
    it("only lowers > minIndex sometimes", () => {
      const totalPosition = 4;
      const minIndex = 3;
      const res = chooseRemoveIndex(totalPosition, minIndex, () => 0);
      expect(res).toBe(4);
    });
    it("does not lower <= minIndex", () => {
      const totalPosition = 4;
      const minIndex = 4;
      const res = chooseRemoveIndex(totalPosition, minIndex, () => 1);
      expect(res).toBe(4);
    });
  });

  function createPlan() {
    return new PuzzlePlanBuilder(RandomSource.SimpleSource(), {
      maxCycleDepth: 1,
      level: enumFlagsToBooleans(Feature, 0),
    }).build();
  }
  describe("class instance", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("can create an instance", () => {
      const generator = new PuzzleGenerator(
        RandomSource.SimpleSource(),
        transfomerMock,
        puzzleContextFactoryMock,
        createPlan(),
      );
      expect(generator).toBeTruthy();
    });

    it("can create an result", () => {
      const generator = new PuzzleGenerator(
        RandomSource.SimpleSource(),
        transfomerMock,
        puzzleContextFactoryMock,
        createPlan(),
      );
      const result = generator.prepare();
      testResultStructure(result);
    });

    it("runs the max level minus multize", () => {
      const otherWordsFact = new OtherWordsService({
        extraWords: false,
        chaosWords: false,
      });

      const level = enumFlagsToBooleans(
        Feature,
        levelMax &
          ~(
            Feature.MULTIZE_I_TOKENS |
            Feature.MULTIZE_TOKENS |
            Feature.MULTIZE_PLACEMENT
          ),
      );

      const random = RandomSource.SimpleSource();
      const context = new PuzzleContextFactory(
        otherWordsFact,
        random,
        pangramsDefault,
        [],
        level,
      );

      const opts = {
        multiInput: false,
        multiTokens: false,
      };

      const mappings = new MappingTransformer(random, opts);
      const generator = new PuzzleGenerator(
        RandomSource.SimpleSource(),
        mappings,
        context,
        createPlan(),
      );

      testResultStructure(generator.prepare());
    });
  });
});
