import {
  prepare,
  print,
  ExpressionParts,
  getInitialDescription,
  getTableMappingHeader,
  getMappingMessage,
  getInstructionsMessage,
  getSymbolisedSentenceOutput,
} from "../app";

function replaceCharAt(str: string, index: number, newChar: string): string {
  return str.substring(0, index) + newChar + str.substring(index + 1);
}

describe("prepare", () => {

  // provide enough args to allow a splice
  //const prepareArgs = "qyaiu "
  //  .repeat(15)
  //  .split(" ")
  //  // ensure all stirngs are unique
  //  .map((v, idx) => replaceCharAt(v.repeat(idx + 1), idx, "4"));
  //console.log(prepareArgs.length);
  const prepareArgs = [];

  it("should return an object with the correct properties", () => {
    const result = prepare(prepareArgs);
    expect(result).toHaveProperty("tokenMap");
    expect(result).toHaveProperty("tokenizedWords");
    expect(result).toHaveProperty("tokenizedSentence");
    expect(result).toHaveProperty("partialTokenizedSentence");
    expect(result).toHaveProperty("sentence");
    expect(result).toHaveProperty("sentenceWords");
    expect(result).toHaveProperty("correctAnswer");
    expect(result).toHaveProperty("realAnswer");
    expect(result).toHaveProperty("expression");
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
        ExpressionParts.OLD_OPARAND,
        ExpressionParts.OPERATOR,
        ExpressionParts.NEW_OPARAND,
      ],
      expressionType: "infix",
    };

    print(mockPartialTokenizedSentence, mockTokenMap, mockExpression, output);

    expect(output).toHaveBeenCalled();

    // Get all calls to the output function, flattened to a single array of strings
    const allOutputCalls = output.mock.calls.flat();

    expect(allOutputCalls[0]).toBe(
      getInitialDescription(mockExpression.equalSymbol),
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
