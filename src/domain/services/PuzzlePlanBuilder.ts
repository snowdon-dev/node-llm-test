import { instructionSet, blankWordToken, rotN, toBinary } from "../characters";
import { ISymbols, SymbolRaw, SymbolTypeOptions } from "../interface";
import { IRandom } from "../IRandom";
import { IConfig } from "../IConfig";
import { PuzzlePlan } from "./PuzzlePlan";
import { WidenLiterals } from "../../utils/ts";
import { SymbolMapper } from "../models/SymbolMapper";

export function createSymbolExpression<T extends SymbolTypeOptions>(
  expr: SymbolMapper<T>,
): SymbolMapper<T> {
  return expr;
}

export function mapStringsDeep<T>(
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

export function generatePartialTokenized(
  isPartialReason: boolean,
  partialTokenizedWords: SymbolRaw[],
  tokenRefRemoveIdx: number,
  placementIdx: number,
  dummyIdx: number,
  rand: IRandom,
): [string] | [string, string] {
  if (!isPartialReason) {
    return [blankWordToken];
  }
  let activePartial: [string] | [string, string] = [
    ...partialTokenizedWords[tokenRefRemoveIdx],
  ];
  const tmp = partialTokenizedWords[dummyIdx];
  const replacementIdx = tmp.length === 2 ? placementIdx : 0;
  const replacement = tmp[replacementIdx];
  if (activePartial.length !== 1 && rand.bool()) {
    activePartial[placementIdx] = replacement;
    return activePartial;
  } else {
    return [replacement];
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

export class PuzzlePlanBuilder {
  constructor(
    private readonly random: IRandom,
    private readonly config: IConfig,
  ) {}

  build(): PuzzlePlan {
    const level = this.config.level;
    const hasMappingDepth = !!level.MAPPING_DEPTH;
    const hasMultiPlacement = level.MULTIZE_PLACEMENT && level.MULTIZE_TOKENS;

    const enablePartialReasoning = level.PARTIAL_REASINING;
    const encodeInstructions =
      level.MULTIZE_I_TOKENS === level.MULTIZE_TOKENS &&
      level.ENCODE_INSTRUCTIONS;

    const wordSeparator = level.EXCLUDE_SENTENCE_SPACES ? "" : " ";

    const mappingDepth = hasMappingDepth
      ? () => this.random.rand(this.config.maxCycleDepth - 1) + 1
      : () => 1;
    const placementIdx = hasMultiPlacement
      ? () => this.random.rand(1)
      : () => 0;
    const buildInstructionWords = encodeInstructions
      ? (getToken: (str: string) => ISymbols) =>
          mapStringsDeep(instructionSet, (s) =>
            s
              .trim()
              .split(/\s+/)
              .map((w) => getToken(w).str)
              .join(" "),
          )
      : (_: (str: string) => ISymbols) => instructionSet;

    const blankPartialWord = enablePartialReasoning
      ? (dummyWord: string): string => dummyWord
      : (_: string): string => blankWordToken;

    return {
      mappingDepth,
      placementIdx,

      buildSymbolMapper: () =>
        buildSymbolMapper(this.random.rand, level.INDIRECT_SYMBOLS),

      buildInstructionWords,

      generatePartialTokenized: (
        partialTokenizedWords,
        tokenRefRemoveIdx,
        placementIdx,
        dummyIdx,
      ) =>
        generatePartialTokenized(
          enablePartialReasoning,
          partialTokenizedWords,
          tokenRefRemoveIdx,
          placementIdx,
          dummyIdx,
          this.random,
        ),

      blankPartialWord,
      wordSeparator,

      binarySeparator: (type) =>
        ["binary", "binaryrot"].includes(type) ? " " : wordSeparator,

      buildTestComplex: () => ({
        identLocationOrder: this.random.rand(1),
        identLocationType: this.random.rand(1),
        puzzleType: level.MAPPING_INFO_PUZZLE
          ? this.random.bool()
            ? ("reverse" as const)
            : ("order" as const)
          : (false as const),
      }),
    };
  }
}
