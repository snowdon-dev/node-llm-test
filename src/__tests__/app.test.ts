import {
  prepare,
  print,
  ExpressionPart,
  getInitialDescription,
  getTableMappingHeader,
  getMappingMessage,
  getInstructionsMessage,
  getSymbolisedSentenceOutput,
  IPrepareResult,
} from "../app";

describe("prepare", () => {

  const prepareArgs = [];
  
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

    print(mockPartialTokenizedSentence, mockTokenMap, mockExpression, output);

    expect(output).toHaveBeenCalled();

    // Get all calls to the output function, flattened to a single array of strings
    const allOutputCalls = output.mock.calls.flat();

    expect(allOutputCalls[0]).toBe(
      getInitialDescription(
        mockExpression.equalSymbol,
        mockExpression.expressionDefinition,
      ),
    );
    expect(allOutputCalls[1]).toBe(getTableMappingHeader());

    // Check for each mapping entry
    Object.entries(mockTokenMap).forEach(([old, newS]) => {
      const expectedMsg = getMappingMessage(
        old,
        newS,
        mockExpression.equalSymbol,
        mockExpression.expressionDefinition,
      );
      expect(allOutputCalls).toContain(expectedMsg);
    });

    expect(allOutputCalls).toContain(getInstructionsMessage());
    expect(allOutputCalls).toContain(
      getSymbolisedSentenceOutput(mockPartialTokenizedSentence),
    );
  });
});
