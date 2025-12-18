import { RandomSource } from "../infra/random";
import { MappingTransformer } from "../domain/services/MappingTransformer";
import { PuzzleContext } from "../domain/models/PuzzleContext";
import { enumFlagsToBooleans, Feature, levelMax } from "../domain/levels";
import { IPrepareResult, ISymbols, SymbolRaw } from "../domain/interface";

jest.mock("../domain/characters", () => {
  const originalModule = jest.requireActual("../domain/characters");
  return {
    ...originalModule,
    toBinary: jest.fn((s) => `bin(${s})`),
    rotN: jest.fn((s: string, shift: number) => `${s}_rot${shift}`),
  };
});

import { pangramsDefault, rotN, toBinary } from "../domain/characters";

import {
  buildSymbolMapper,
  chooseRemoveIndex,
  createSymbolExpression,
  generatePartialTokenized,
  PuzzleGenerator,
} from "../domain/services/PuzzleGenerator";
import { PuzzleContextFactory } from "../domain/PuzzleContextFactory";
import { OtherWordsService } from "../domain/services/OtherWordsService";

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
    return {
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

  describe("generatePartialTokenized", () => {
    const blank: string = "[...]";

    it("returns [blankWordToken] if isPartialReason is false", () => {
      const result = generatePartialTokenized(false, ["a", "b"], 0, () => true);
      expect(result).toEqual([blank]);
    });

    it("returns [blankWordToken] if activePartial.length === 1", () => {
      const result = generatePartialTokenized(true, ["a"], 0, () => true);
      expect(result).toEqual([blank]);
    });

    it("replaces placementIdx when randomBool returns true", () => {
      const result = generatePartialTokenized(true, ["a", "b"], 1, () => true);
      expect(result).toEqual(["a", blank]);
    });

    it("returns [blankWordToken] when randomBool returns false", () => {
      const result = generatePartialTokenized(true, ["a", "b"], 1, () => false);
      expect(result).toEqual([blank]);
    });
  });

  describe("buildSymbolMapper", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns "none" mapper when indirectSymbolsFlag is false (type 0)', () => {
      const rand = jest.fn();
      const result = buildSymbolMapper(rand, false);

      // options should indicate none and mapper should return same input
      expect(result.options).toEqual({ type: "none" });
      const input: SymbolRaw = ["a", "b"];
      expect(result.mapper(input)).toEqual(input);
      // rand should not have been called (no random usage when flag false)
      expect(rand).not.toHaveBeenCalled();
    });

    it("returns rot mapper (type 1) using provided shift", () => {
      // To get type 1: rand(2) must return 0 -> +1 => 1
      // Then rand(24) returns e.g. 3 -> shift = 4
      const rand = jest
        .fn()
        .mockReturnValueOnce(0) // rand(2) -> 0 -> +1 => type 1
        .mockReturnValueOnce(3); // rand(24) -> 3 -> shift = 4

      const result = buildSymbolMapper(rand, true);

      expect(result.options).toEqual({ type: "rot", rotNNum: 4 });

      const input: SymbolRaw = ["x", "y"];
      // mapper should call rotN on each entry with shift 4
      const mapped = result.mapper(input);
      expect(rotN).toHaveBeenCalledTimes(2);
      expect(rotN).toHaveBeenCalledWith("x", 4);
      expect(rotN).toHaveBeenCalledWith("y", 4);
      expect(mapped).toEqual(["x_rot4", "y_rot4"]);
    });

    it("returns binary mapper (type 2)", () => {
      // To get type 2: rand(2) -> 1 -> +1 => 2
      const rand = jest.fn().mockReturnValueOnce(1);
      const result = buildSymbolMapper(rand, true);

      expect(result.options).toEqual({ type: "binary" });

      const input: SymbolRaw = ["hello"];
      const mapped = result.mapper(input);
      expect(toBinary).toHaveBeenCalledTimes(1);
      expect(toBinary).toHaveBeenCalledWith("hello");
      expect(mapped).toEqual(["bin(hello)"]);
    });

    it("returns binaryrot mapper (type 3) combining rotN then toBinary", () => {
      // To get type 3: rand(2) -> 2 -> +1 => 3
      // Then rand(24) returns e.g. 5 -> shift = 6
      const rand = jest
        .fn()
        .mockReturnValueOnce(2) // rand(2) -> 2 -> +1 => 3
        .mockReturnValueOnce(5); // rand(24) -> 5 -> shift = 6

      const result = buildSymbolMapper(rand, true);

      expect(result.options).toEqual({ type: "binaryrot", rotNNum: 6 });

      const input: SymbolRaw = ["A"];
      const mapped = result.mapper(input);

      // ensure rotN called first then toBinary
      expect(rotN).toHaveBeenCalledTimes(1);
      expect(rotN).toHaveBeenCalledWith("A", 6);
      expect(toBinary).toHaveBeenCalledTimes(1);
      // rotN returns 'A_rot6', toBinary returns 'bin(A_rot6)'
      expect(mapped).toEqual(["bin(A_rot6)"]);
    });
  });

  describe("class instance", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("can create an instance", () => {
      const generator = new PuzzleGenerator(
        RandomSource.SimpleSource(),
        transfomerMock,
        puzzleContextFactoryMock,
        {
          maxCycleDepth: 1,
          level: enumFlagsToBooleans(Feature, 0),
        },
      );
      expect(generator).toBeTruthy();
    });

    it("can create an result", () => {
      const generator = new PuzzleGenerator(
        RandomSource.SimpleSource(),
        transfomerMock,
        puzzleContextFactoryMock,
        {
          maxCycleDepth: 1,
          level: enumFlagsToBooleans(Feature, 0),
        },
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
            Feature.MULTIIZE_PLACEMENT
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
        {
          maxCycleDepth: 1,
          level,
        },
      );

      testResultStructure(generator.prepare());
    });
  });
});
