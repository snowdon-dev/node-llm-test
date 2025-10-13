import { instructionSet } from "../domain/characters";
import { ExpressionPart } from "../domain/interface";
import { Description } from "../domain/models/Description";
import { createSymbolExpression } from "../domain/services/PuzzleGenerator";
import { RandomSource } from "../infra/random";

describe("Description", () => {
  const types = [
    { type: "none" },
    { type: "rot", rotNNum: 0 },
    { type: "binaryrot", rotNNum: 0 },
    { type: "binary" },
  ] as const;

  let desc: Description;

  beforeEach(() => {
    desc = new Description(RandomSource.SimpleSource());
  });

  describe("getInitialDescription", () => {
    // does not need all * 4 for coverage
    Array.from({ length: (1 << 3) * 4 }, (_, i) => i).forEach((level) => {
      const opts = {
        val1: Boolean(level & (1 << 0)),
        val2: Boolean(level & (1 << 1)),
        val3: Number(Boolean(level & (1 << 2))),
        typeNum: (level >> 3) % 4,
      };
      let res: string[];
      beforeEach(() => {
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
          options: types[opts.typeNum],
        });

        res = desc.getInitialDescription(
          mockExpression.equalSymbol,
          mockExpression.expressionDefinition,
          mockSymbolExpression,
          opts.val1,
          instructionSet,
          opts.val2,
          opts.val3,
        );
      });

      it("works", () => {
        expect(res).toBeTruthy();
      });
    });
  });

  describe.skip("getMappingMessage", () => {
    let message: string;
    beforeEach(() => {
      const mockExpression = {
        equalSymbol: "=",
        expressionDefinition: [
          ExpressionPart.OLD_OPARAND,
          ExpressionPart.OPERATOR,
          ExpressionPart.NEW_OPARAND,
        ] as [ExpressionPart, ExpressionPart, ExpressionPart],
        expressionType: "infix",
      };
      //message = desc.getMappingMessage(
      //  "one",
      //  "two",
      //  "=",
      //  mockExpression.expressionDefinition,
      //  i,
      //  identLocation,
      //  poorCodingStandards,
      //  expressionChange,
      //);
    });
    it.skip("work", () => {});
  });
});
