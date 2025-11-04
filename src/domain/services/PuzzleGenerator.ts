import {
  blankWordToken,
  rotN,
  toBinary,
  equalSymblsSet,
  instructionSet,
} from "../characters";
import { SymbolMapper } from "../models/SymbolMapper";
import { PuzzleContextFactory } from "../PuzzleContextFactory";
import {
  ISymbols,
  SymbolRaw,
  SymbolTypeOptions,
  IExpressionResult,
  ExpressionPart,
  ExpressionDefinitionType,
} from "../interface";
import { LevelsType } from "../levels";
import { RandomSource, getRandomOrder } from "../../infra/random";
import { PuzzleResult } from "../models/PuzzleResult";
import { MappingTransformer } from "./MappingTransformer";
import { WidenLiterals } from "../../utils/ts";

export function createSymbolExpression<T extends SymbolTypeOptions>(
  expr: SymbolMapper<T>,
): SymbolMapper<T> {
  return expr;
}

function mapStringsDeep<T>(
  obj: T,
  fn: (s: string) => string,
): WidenLiterals<T> {
  if (typeof obj === "string") {
    return fn(obj) as WidenLiterals<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapStringsDeep(item, fn)) as WidenLiterals<T>;
  }

  if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = mapStringsDeep(value, fn);
    }
    return result;
  }

  return obj as WidenLiterals<T>;
}

export class PuzzleGenerator {
  public result?: PuzzleResult;

  constructor(
    private readonly random: RandomSource,
    private readonly mapFactory: MappingTransformer,
    public readonly level: LevelsType,
    private readonly ctx: PuzzleContextFactory,
  ) {}

  prepare(): PuzzleResult {
    const ctx = this.ctx.create();
    const { tokenMap, realMap, wordsSeqs } = this.mapFactory.create(ctx);

    const tokenizedSequenceWords: ISymbols[] = [];
    for (const word of wordsSeqs) {
      const el = tokenMap[word.str];
      tokenizedSequenceWords.push(el);
    }

    const totalPosition = this.random.rand(tokenizedSequenceWords.length - 1);

    const minIndex = ctx.minCount - 1;
    const tokenRefRemoveIdx =
      totalPosition > minIndex && this.random.rand(2) > 0
        ? this.random.rand(minIndex)
        : totalPosition;

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].str;
    const realAnswer = wordsSeqs[tokenRefRemoveIdx].str;

    const symbolExpression = this.buildSymbolMapper();

    // insert a missing identifier
    const partialWords = wordsSeqs.map((v) => v.str);
    partialWords[tokenRefRemoveIdx] = blankWordToken;

    // insert missing tokenized part
    const partialTokenizedWords: SymbolRaw[] = [];
    for (const obj of tokenizedSequenceWords) {
      partialTokenizedWords.push(symbolExpression.mapper(obj.els));
    }
    const isPartialReason = this.level.PARTIAL_REASINING;
    const activePartial: [string] | [string, string] = [
      ...partialTokenizedWords[tokenRefRemoveIdx],
    ];
    if (isPartialReason && activePartial.length !== 1 && this.random.bool()) {
      activePartial[0] = blankWordToken;
      partialTokenizedWords[tokenRefRemoveIdx] = activePartial;
    } else {
      // TODO: hide half a word
      partialTokenizedWords[tokenRefRemoveIdx] = [blankWordToken];
    }

    const seperator = this.level.EXCLUDE_SENTENCE_SPACES ? "" : " ";

    const binarySeperator = ["binary", "binaryrot"].includes(
      symbolExpression.options.type,
    )
      ? " "
      : seperator;

    let partialTokenizedSentence = "";
    for (let i = 0; i < partialTokenizedWords.length; i++) {
      const arr = partialTokenizedWords[i];
      for (let j = 0; j < arr.length; j++) {
        if (partialTokenizedSentence)
          partialTokenizedSentence += binarySeperator;
        partialTokenizedSentence += arr[j];
      }
    }

    let tokenizedSentence = "";
    for (let i = 0; i < tokenizedSequenceWords.length; i++) {
      if (i > 0) tokenizedSentence += seperator;
      tokenizedSentence += tokenizedSequenceWords[i].str;
    }

    const testComplex = {
      identLocationOrder: this.random.rand(1),
      identLocationType: this.random.rand(1),
      puzzleType: this.level.MAPPING_INFO_PUZZLE
        ? this.random.bool()
          ? ("reverse" as const)
          : ("order" as const)
        : (false as const),
    };

    const expression = this.buildExpresion();

    const instructionWords =
      this.level.MULTIZE_I_TOKENS === this.level.MULTIZE_TOKENS &&
      this.level.ENCODE_INSTRUCTIONS
        ? mapStringsDeep(instructionSet, (s) =>
            // TODO: pphhhhb
            s
              .trim()
              .split(/\s+/)
              .map((w) => tokenMap[w].str)
              .join(" "),
          )
        : instructionSet;

    const res = {
      realMap,
      tokenMap,

      tokenizedWords: tokenizedSequenceWords,
      tokenizedSentence,
      partialTokenizedSentence,
      partialTokenizedWords,

      sentence: ctx.chosen.join(" "),

      sentenceWords: ctx.chosen,
      partialWords,
      wordsSeqs,

      correctAnswer,
      realAnswer,

      expression,
      symbolExpression,
      testComplex,

      instructionWords,
    };

    return new PuzzleResult(res);
  }

  private buildSymbolMapper(): SymbolMapper<SymbolTypeOptions> {
    type MappedSymbol = [string] | [string, string];
    const type = !this.level.INDIRECT_SYMBOLS ? 0 : this.random.rand(2) + 1;
    switch (type) {
      case 1: {
        const shift = this.random.rand(24) + 1;
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => rotN(wIn, shift)) as MappedSymbol,
          options: {
            type: "rot",
            rotNNum: shift,
          },
        });
      }
      case 2: {
        return createSymbolExpression({
          mapper: (w) => w.map((wIn) => toBinary(wIn)) as MappedSymbol,
          options: { type: "binary" },
        });
      }
      case 3: {
        const shift = this.random.rand(24) + 1;
        return createSymbolExpression({
          mapper: (w) =>
            w.map((wIn) => toBinary(rotN(wIn, shift))) as MappedSymbol,
          options: {
            type: "binaryrot",
            rotNNum: shift,
          },
        });
      }
      default: {
        return createSymbolExpression({
          mapper: (w) => w,
          options: { type: "none" },
        });
      }
    }
  }

  private buildExpresion(): IExpressionResult {
    const equalSymbol =
      equalSymblsSet[this.random.rand(equalSymblsSet.length - 1)];
    const expressionDefinition = getRandomOrder(
      [
        ExpressionPart.OLD_OPARAND,
        ExpressionPart.OPERATOR,
        ExpressionPart.NEW_OPARAND,
      ] as ExpressionDefinitionType,
      this.random.rand,
    );
    const idx = expressionDefinition.indexOf(ExpressionPart.OPERATOR);
    const expressionType =
      idx === 0 ? "prefix" : idx === 1 ? "infix" : "postfix";
    return {
      expressionDefinition: expressionDefinition,
      expressionType,
      equalSymbol,
    };
  }
}
