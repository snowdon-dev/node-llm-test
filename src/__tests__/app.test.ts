import {
  print,
  getInitialDescription,
  getTableMappingHeader,
  getMappingMessage,
  getInstructionsMessage,
  getSymbolisedSentenceOutput,
  answer,
} from "../app";
import { createSymbolExpression, makePuzzleService } from "../PuzzleResult";
import { ExpressionPart, ISymbols } from "../interface";
import { IPrepareResult } from "../interface";
import { levelMax } from "../levels";
import { instructionSet, pangramsDefault } from "../characters";
import { simpleRandom } from "../random";


function createISymbol(words: string): ISymbols {
  const [first, second] = words.split(" ");
  return {
    str: words,
    els: [first, second].filter((v) => v !== void 0) as [string]|[string|string],
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
    const builder = makePuzzleService(level, inputWords ?? [], pangrams, seed);
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
    expect(result.tokenMap[result.realAnswer].str).toBe(result.correctAnswer);
    expect(result.correctAnswer).toBe(tokenizedRemovedWord.str);
  });
});

describe("print", () => {
  it("should call the output function with the correct arguments and content", () => {
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
        newS.str,
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

  it("answers exact multi answer", () => {
    const result = answer("toxic and", multiTokenContext);
    expect(result.exact).toBe(true);
  });

  const multiRealWords = {
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
    const res = answer("every Just", multiRealWords);
    expect(res.exact).toBe(true);
    const res2 = answer("every", multiRealWords);
    expect(res2.exact).toBe(false);
    expect(res2.possible).toBe(false);
  });

  const multiRealWordsNotExpected = {
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
    const res = answer("test test", multiRealWordsNotExpected);
    expect(res.exact).toBe(false);
    expect(res.possible).toBe(true);
  });

  const multiTokenNotExpectedContext = {
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
