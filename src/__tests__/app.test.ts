import {
  print,
  getInitialDescription,
  getTableMappingHeader,
  getMappingMessage,
  getInstructionsMessage,
  getSymbolisedSentenceOutput,
  answer,
} from "../app";
import { createSymbolExpression } from "../PuzzleFactory";
import { PuzzleFactory } from "../PuzzleFactory";
import { ExpressionPart } from "../interface";
import { IPrepareResult } from "../interface";
import { levelMax } from "../levels";
import { instructionSet, pangramsDefault } from "../characters";
import { simpleRandom } from "../random";

describe("prepare", () => {
  const prepareArgs = [];

  function prepare(
    inputWords?: string[],
    seed: number = 1,
    pangrams: readonly string[] = pangramsDefault,
    level: number = 0,
  ) {
    const builder = PuzzleFactory.New(level, inputWords, pangrams, seed);
    return builder.prepare();
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

    it("with only inputWords", () => {
      const result = prepare(prepareArgs);
      testResult(result);
    });

    it("with a seed", () => {
      testResult(prepare(prepareArgs, 1));
    });

    it("with input pangrams", () => {
      testResult(prepare(prepareArgs, undefined, ["test"]));
    });

    Array(levelMax - 1)
      .fill(0)
      .map((_, i) => i + 2)
      .forEach((l) => {
        it("with only inputWords, + level " + l, () => {
          const result = prepare(prepareArgs, undefined, undefined, l);
          testResult(result);
        });

        it("with a seed, + level " + l, () => {
          testResult(prepare(prepareArgs, 1, undefined, l));
        });

        it("with input pangrams, + level " + l, () => {
          testResult(prepare(prepareArgs, undefined, ["test"], l));
        });
      });
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
    const tokenizedRemovedWord = result.tokenMap[removedWord];
    expect(result.tokenMap[result.realAnswer]).toBe(result.correctAnswer);
    expect(result.correctAnswer).toBe(tokenizedRemovedWord);
  });
});

describe("print", () => {
  it("should call the output function with the correct arguments and content", () => {
    const output = jest.fn();
    const mockPartialTokenizedSentence =
      "The [...] brown fox jumps over the lazy dog";
    const mockTokenMap = {
      The: "abc",
      quick: "def",
      brown: "ghi",
      fox: "jkl",
      jumps: "mno",
      over: "pqr",
      the: "stu",
      lazy: "vwx",
      dog: "yzA",
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

    print(
      mockPartialTokenizedSentence,
      mockTokenMap,
      mockExpression,
      mockSymbolExpression,
      1,
      output,
      {
        identLocationOrder: 0,
        identLocationType: 0,
        puzzleType: false,
        rand: simpleRandom,
      },
    );

    expect(output).toHaveBeenCalled();

    // Get all calls to the output function, flattened to a single array of strings
    const allOutputCalls = output.mock.calls.flat();

    expect(allOutputCalls[0]).toBe(
      getInitialDescription(
        mockExpression.equalSymbol,
        mockExpression.expressionDefinition,
        mockSymbolExpression,
        false,
        instructionSet,
        false,
        0,
      ),
    );
    expect(allOutputCalls[2]).toBe(getTableMappingHeader(instructionSet));

    // Check for each mapping entry
    Object.entries(mockTokenMap).forEach(([old, newS], i) => {
      const expectedMsg = getMappingMessage(
        old,
        newS,
        mockExpression.equalSymbol,
        mockExpression.expressionDefinition,
        i,
        0,
        false,
        false,
      );
      expect(allOutputCalls).toContain(expectedMsg);
    });

    const isIndirect = mockSymbolExpression.options.type !== "none";
    expect(allOutputCalls).toContain(
      getInstructionsMessage(isIndirect, instructionSet, false),
    );
    expect(allOutputCalls).toContain(
      getSymbolisedSentenceOutput(mockPartialTokenizedSentence, instructionSet),
    );
  });
});

describe("answer", () => {
  const multiTokenContext = {
    tokenMap: {
      Grumpy: "wizards make",
      wizards: "make",
      make: "toxic and",
      toxic: "queen",
      brew: "the",
      for: "evil",
      the: "and",
      evil: "for Grumpy",
      queen: "Jack",
      and: "brew",
      Jack: "Grumpy for",
    },
    realMap: {
      "wizards make": "Grumpy",
      make: "wizards",
      "toxic and": "make",
      queen: "toxic",
      the: "brew",
      evil: "for",
      and: "the",
      "for Grumpy": "evil",
      Jack: "queen",
      brew: "and",
      "Grumpy for": "Jack",
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

  it("answers exact multi answer", () => {
    const result = answer("toxic and", multiTokenContext);
    expect(result.exact).toBe(true);
  });

  const multiRealWords = {
    tokenMap: {
      "Just keep": "keep examining",
      examining: "for",
      "every low": "zinc low",
      "bid quoted": "bid etchings",
      for: "quoted",
      "zinc etchings": "every Just",
    },
    realMap: {
      "keep examining": "Just keep",
      for: "examining",
      "zinc low": "every low",
      "bid etchings": "bid quoted",
      quoted: "for",
      "every Just": "zinc etchings",
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
    const res = answer("every Just", multiRealWords);
    expect(res.exact).toBe(true);
    const res2 = answer("every", multiRealWords);
    expect(res2.exact).toBe(false);
    expect(res2.possible).toBe(false);
  });

  const multiRealWordsNotExpected = {
    // missing word is zinc
    tokenMap: {
      "Just keep": "keep examining",
      examining: "for",
      "every low": "zinc low",
      "bid quoted": "bid etchings",
      for: "quoted",
      "zinc etchings": "every Just",
      "zzinc eetchings": "test test", // extra char
    },
    realMap: {
      "keep examining": "Just keep",
      for: "examining",
      "zinc low": "every low",
      "bid etchings": "bid quoted",
      quoted: "for",
      "every Just": "zinc etchings",
      "test test": "zzinc eetchings", // extra char
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
    const res = answer("test test", multiRealWordsNotExpected);
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(true);
  });

  const multiTokenNotExpectedContext = {
    tokenMap: {
      Jackdaws: "Jackdaws",
      love: "sphinx",
      my: "love quartz",
      big: "big Jackdaws",
      bigg: "test test",
      sphinx: "quartz big",
      of: "my",
      quartz: "of",
    },
    realMap: {
      Jackdaws: "Jackdaws",
      sphinx: "love",
      "love quartz": "my",
      "big Jackdaws": "big",
      "test test": "bigg",
      "quartz big": "sphinx",
      my: "of",
      of: "quartz",
    },
    partialWords: ["Jackdaws", "love", "my", "[...]", "sphinx", "of", "quartz"],
    sentenceWords: ["Jackdaws", "love", "my", "big", "sphinx", "of", "quartz"],
    correctAnswer: "big Jackdaws",
  };

  it("answers multi token words not expacted", () => {
    const res = answer("test test", multiTokenNotExpectedContext);
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(true);
  });

  it("answers false for duplicate multi token word", () => {
    const res = answer("quartz big", multiTokenNotExpectedContext);
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(false);
  });
});
