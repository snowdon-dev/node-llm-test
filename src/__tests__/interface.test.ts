import { createSymbolExpression } from "../domain/services/PuzzleGenerator";
import { ExpressionPart, ISymbols } from "../domain/interface";
import { IPrepareResult } from "../domain/interface";
import { levelMax } from "../domain/levels";
import { instructionSet, pangramsDefault } from "../domain/characters";
import { PuzzleResult } from "../domain/models/PuzzleResult";
import { createApp } from "../infra/create";

function createISymbol(words: string): ISymbols {
  const [first, second] = words.split(" ");
  return {
    str: words,
    els: [first, second].filter((v) => v !== void 0) as
      | [string]
      | [string | string],
  };
}

describe("prepare", () => {
  const prepareArgs = [];

  function prepare(
    inputWords?: string[],
    seed: number = 1,
    pangrams: readonly string[] = pangramsDefault,
    level: number = 0,
  ) {
    const game = createApp(level, seed, inputWords ?? [], pangrams);
    return game.result();
  }

  describe("should return an object with the correct properties", () => {
    function testResult(result: IPrepareResult) {
      expect(result).toHaveProperty("tokenMap");
      expect(result).toHaveProperty("realMap");

      expect(result).toHaveProperty("tokenizedWords");
      expect(result).toHaveProperty("tokenizedSentence");
      expect(result).toHaveProperty("partialTokenizedSentence");

      expect(result).toHaveProperty("sentence");
      expect(result).toHaveProperty("sentenceWords");
      expect(result).toHaveProperty("partialWords");

      expect(result).toHaveProperty("correctAnswer");
      expect(result).toHaveProperty("realAnswer");

      expect(result).toHaveProperty("expression");
    }

    it("throws invalid seed", () => {
      expect(() => prepare([], -1)).toThrow();
      expect(() => prepare([], 2 ** 31)).toThrow();
    });

    it("throws invalid panagrams", () => {
      expect(() => prepare([], 1, [])).toThrow();
    });

    it("throws invalid level", () => {
      expect(() => prepare([], 1, void 0, levelMax + 1)).toThrow();
      expect(() => prepare([], 1, void 0, -1)).toThrow();
    });

    it("with blank inputWords", () => {
      const result = prepare(prepareArgs);
      testResult(result);
    });

    it("with inputWords", () => {
      const result = prepare(["anotherasdkjnfsdfj"]);
      testResult(result);
    });

    it("with inputWords and chaosWords", () => {
      const result = prepare(["anotherasdkjnfsdfj"], 1, void 0, 1);
      testResult(result);
    });

    it("with a seed", () => {
      testResult(prepare(prepareArgs, 1));
    });

    it("with a math random", () => {
      testResult(prepare(prepareArgs, undefined));
    });

    it("with input pangrams", () => {
      testResult(prepare(prepareArgs, undefined, ["one two three"]));
    });

    //Array(levelMax - 1)
    //  .fill(0)
    //  .map((_, i) => i + 1)
    //  .forEach((l) => {
    //    it("with only inputWords, + level " + l, () => {
    //      const result = prepare(prepareArgs, undefined, undefined, l);
    //      testResult(result);
    //    });

    //    it("with a seed, + level " + l, () => {
    //      testResult(prepare(prepareArgs, 1, undefined, l));
    //    });

    //    it("with input pangrams, + level " + l, () => {
    //      testResult(prepare(prepareArgs, undefined, ["one two three"], l));
    //    });
    //  });
  });

  it("should generate a tokenMap", () => {
    const result = prepare([]);
    expect(Object.keys(result.tokenMap).length).toBeGreaterThan(0);
  });

  it("should generate a tokenizedSentence", () => {
    const result = prepare([]);
    expect(result.tokenizedSentence.length).toBeGreaterThan(0);
  });

  it("should generate a partialTokenizedSentence with a placeholder", () => {
    const result = prepare([]);
    expect(result.partialTokenizedSentence).toContain("[...]");
  });

  it("should return the correct answer", () => {
    const result = prepare([]);
    const removedWord = result.realAnswer;
    const tokenizedRemovedWord = result.getToken(removedWord);
    expect(result.getToken(result.realAnswer).str).toBe(result.correctAnswer);
    expect(result.correctAnswer).toBe(tokenizedRemovedWord.str);
  });
});

const createArgs = (input: Partial<IPrepareResult>) => {
  return Object.assign({}, input) as IPrepareResult;
};

const createPuzzle = (input: Partial<IPrepareResult>) => {
  return new PuzzleResult(createArgs(input));
};

describe("print", () => {
  it("should call the output function", () => {
    const output = jest.fn();
    const mockPartialTokenizedSentence =
      "The [...] brown fox jumps over the lazy dog";
    const mockTokenMap = {
      The: createISymbol("abc"),
      quick: createISymbol("def"),
      brown: createISymbol("ghi"),
      fox: createISymbol("jkl"),
      jumps: createISymbol("mno"),
      over: createISymbol("pqr"),
      the: createISymbol("stu"),
      lazy: createISymbol("vwx"),
      dog: createISymbol("yzA"),
    };
    const mockExpression = {
      equalSymbol: "=",
      expressionDefinition: [
        ExpressionPart.OLD_OPARAND,
        ExpressionPart.OPERATOR,
        ExpressionPart.NEW_OPARAND,
      ] as [ExpressionPart, ExpressionPart, ExpressionPart],
      expressionType: "infix",
    };

    const mockSymbolExpression = createSymbolExpression({
      mapper: (w) => w,
      options: { type: "none" },
    });

    const result = createPuzzle({
      symbolExpression: mockSymbolExpression,
      expression: mockExpression,
      tokenMap: mockTokenMap,
      partialTokenizedSentence: mockPartialTokenizedSentence,
      instructionWords: instructionSet,
      testComplex: {
        identLocationOrder: 0,
        identLocationType: 0,
        puzzleType: false,
      },
    });

    const app = createApp(0, 1, [], ["just pass validation"]);
    app.print(result, output);

    expect(output).toHaveBeenCalled();
    expect(output).toHaveBeenCalledTimes(9);
  });
});
