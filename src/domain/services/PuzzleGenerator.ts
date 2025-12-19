import {
  blankWordToken,
  rotN,
  toBinary,
  equalSymblsSet,
  instructionSet,
} from "../characters";
import { SymbolMapper } from "../models/SymbolMapper";
import {
  ISymbols,
  SymbolRaw,
  SymbolTypeOptions,
  IExpressionResult,
  ExpressionPart,
  ExpressionDefinitionType,
} from "../interface";
import { LevelsType } from "../levels";
import { PuzzleResult } from "../models/PuzzleResult";
import { WidenLiterals } from "../../utils/ts";
import { IRandom, RandMaxRangeCallable } from "../IRandom";
import { IMappingTransfomer } from "../IMappingTransfomer";
import { IFactory } from "../IFactory";
import { PuzzleContext } from "../models/PuzzleContext";

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

interface IConfig {
  readonly maxCycleDepth: number;
  readonly level: Readonly<LevelsType>;
}

export function chooseRemoveIndex(
  totalPosition: number,
  minIndex: number,
  rand: RandMaxRangeCallable,
): number {
  if (totalPosition > minIndex && rand(2) > 0) {
    return rand(minIndex);
  }
  return totalPosition;
}

export function generatePartialTokenized(
  isPartialReason: boolean,
  activePartial: [string] | [string, string],
  placementIdx: number,
  randomBool: () => boolean,
): [string] | [string, string] {
  if (isPartialReason && activePartial.length !== 1 && randomBool()) {
    activePartial[placementIdx] = blankWordToken;
    return activePartial;
  } else {
    return [blankWordToken];
  }
}

export function buildSymbolMapper(
  rand: (max: number) => number,
  indirectSymbolsFlag: boolean,
): SymbolMapper<SymbolTypeOptions> {
  type MappedSymbol = [string] | [string, string];

  const type = !indirectSymbolsFlag ? 0 : rand(2) + 1;

  switch (type) {
    case 1: {
      const shift = rand(24) + 1;
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
      const shift = rand(24) + 1;
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

export class PuzzleGenerator {
  public readonly result?: PuzzleResult;
  public readonly level: Readonly<LevelsType>;

  constructor(
    private readonly random: IRandom,
    private readonly mapFactory: IMappingTransfomer,
    private readonly ctx: IFactory<PuzzleContext>,
    private readonly config: IConfig,
  ) {
    this.level = config.level;
  }

  prepare(): PuzzleResult {
    const ctx = this.ctx.create();

    const mappingDepth = this.level.MAPPING_DEPTH
      ? this.random.rand(this.config.maxCycleDepth - 1) + 1
      : 1;

    // TODO: configure enabling 50 percent activation
    const placementIdx =
      this.level.MULTIIZE_PLACEMENT &&
      this.level.MULTIZE_TOKENS
        ? this.random.rand(1)
        : 0;

    // might as well compute a cycle, large models seem to check anyway
    const { getToken, getReal, wordsSeqs, realMap, tokenMap } =
      this.mapFactory.create(ctx, mappingDepth, placementIdx);

    const tokenizedSequenceWords: ISymbols[] = [];
    for (const word of wordsSeqs) {
      const el = getToken(word.str);
      tokenizedSequenceWords.push(el);
    }

    const tokenRefRemoveIdx = chooseRemoveIndex(
      this.random.rand(tokenizedSequenceWords.length - 1),
      ctx.minCount - 1,
      this.random.rand,
    );

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].str;
    const realAnswer = wordsSeqs[tokenRefRemoveIdx].str;

    const symbolExpression = buildSymbolMapper(
      this.random.rand,
      this.level.INDIRECT_SYMBOLS,
    );

    // insert a missing identifier
    const partialWords = wordsSeqs.map((v) => v.str);
    partialWords[tokenRefRemoveIdx] = blankWordToken;

    // insert missing tokenized part
    const partialTokenizedWords: SymbolRaw[] = [];
    for (const obj of tokenizedSequenceWords) {
      partialTokenizedWords.push(symbolExpression.mapper(obj.els));
    }

    partialTokenizedWords[tokenRefRemoveIdx] = generatePartialTokenized(
      this.level.PARTIAL_REASINING,
      [...partialTokenizedWords[tokenRefRemoveIdx]],
      placementIdx,
      this.random.bool,
    );

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

    // TODO: this could currenty be not I tokens, without changing the mapper
    // missing words need to be included for i words
    const instructionWords =
      this.level.MULTIZE_I_TOKENS === this.level.MULTIZE_TOKENS &&
      this.level.ENCODE_INSTRUCTIONS
        ? mapStringsDeep(instructionSet, (s) =>
            // TODO: pphhhhb
            s
              .trim()
              .split(/\s+/)
              .map((w) => getToken(w).str)
              .join(" "),
          )
        : instructionSet;

    const res = {
      realMap,
      getReal,
      tokenMap,
      getToken,

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

  private buildExpresion(): IExpressionResult {
    const equalSymbol =
      equalSymblsSet[this.random.rand(equalSymblsSet.length - 1)];
    const expressionDefinition = this.random.randOrder([
      ExpressionPart.OLD_OPARAND,
      ExpressionPart.OPERATOR,
      ExpressionPart.NEW_OPARAND,
    ] as ExpressionDefinitionType);
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
