/*
 * TODO: move to files

├── models/
│   ├── SymbolMapper.ts
│   ├── buildSymbolMapper.ts        ← NEW
│   └── PuzzleResult.ts
│
├── services/
│   ├── PuzzleGenerator.ts          ← slimmed down
│   ├── PuzzlePlan.ts               ← NEW
│   ├── PuzzlePlanBuilder.ts        ← NEW
│   ├── PartialTokenService.ts      ← NEW
│   └── MappingTransformer.ts
│
├── utils/
│   ├── chooseRemoveIndex.ts         ← NEW
│   └── mapStringsDeep.ts            ← NEW
*/

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
  InstructionWordType,
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

export interface IConfig {
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

export interface PuzzlePlan {
  readonly mappingDepth: () => number;
  readonly placementIdx: () => number;
  readonly buildSymbolMapper: () => SymbolMapper<SymbolTypeOptions>;
  readonly buildInstructionWords: (
    getToken: (s: string) => ISymbols,
  ) => InstructionWordType;
  readonly generatePartialTokenized: (
    partialTokenizedWords: SymbolRaw[],
    tokenRefRemoveIdx: number,
    placementIdx: number,
    dummyIdx: number,
  ) => SymbolRaw;
  readonly blankPartialWord: (dummyWord: string) => string;
  readonly wordSeparator: string;
  readonly binarySeparator: (type: SymbolTypeOptions["type"]) => string;
  readonly buildTestComplex: () => {
    identLocationOrder: number;
    identLocationType: number;
    puzzleType: "reverse" | "order" | false;
  };
}

export class PuzzlePlanBuilder {
  constructor(
    private readonly random: IRandom,
    private readonly config: IConfig,
  ) {}

  build(level: LevelsType): PuzzlePlan {
    const hasMappingDepth = !!level.MAPPING_DEPTH;
    const hasMultiPlacement = level.MULTIZE_PLACEMENT && level.MULTIZE_TOKENS;

    const enablePartialReasoning = level.PARTIAL_REASINING;
    const encodeInstructions =
      level.MULTIZE_I_TOKENS === level.MULTIZE_TOKENS &&
      level.ENCODE_INSTRUCTIONS;

    const wordSeparator = level.EXCLUDE_SENTENCE_SPACES ? "" : " ";

    return {
      mappingDepth: () =>
        hasMappingDepth
          ? this.random.rand(this.config.maxCycleDepth - 1) + 1
          : 1,

      placementIdx: () => (hasMultiPlacement ? this.random.rand(1) : 0),

      buildSymbolMapper: () =>
        buildSymbolMapper(this.random.rand, level.INDIRECT_SYMBOLS),

      buildInstructionWords: (getToken) =>
        encodeInstructions
          ? mapStringsDeep(instructionSet, (s) =>
              s
                .trim()
                .split(/\s+/)
                .map((w) => getToken(w).str)
                .join(" "),
            )
          : instructionSet,

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

      blankPartialWord: (dummyWord) =>
        enablePartialReasoning ? dummyWord : blankWordToken,

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

export class PuzzleGenerator {
  constructor(
    private readonly random: IRandom,
    private readonly mapFactory: IMappingTransfomer,
    private readonly ctx: IFactory<PuzzleContext>,
    private readonly plan: PuzzlePlan,
  ) {}

  prepare(): PuzzleResult {
    const ctx = this.ctx.create();

    const mappingDepth = this.plan.mappingDepth();
    const placementIdx = this.plan.placementIdx();

    const { getToken, getReal, wordsSeqs, realMap, tokenMap, tokenEntries } =
      this.mapFactory.create(ctx, mappingDepth, placementIdx);

    const tokenizedSequenceWords: ISymbols[] = wordsSeqs.map((w) =>
      getToken(w.str),
    );

    const tokenRefRemoveIdx = chooseRemoveIndex(
      this.random.rand(tokenizedSequenceWords.length - 1),
      ctx.minCount - 1,
      this.random.rand,
    );

    const correctAnswer = tokenizedSequenceWords[tokenRefRemoveIdx].str;
    const realAnswer = wordsSeqs[tokenRefRemoveIdx].str;

    const symbolExpression = this.plan.buildSymbolMapper();

    // build partial tokenized words (mapped form)
    const partialTokenizedWords: SymbolRaw[] = tokenizedSequenceWords.map((t) =>
      symbolExpression.mapper(t.els),
    );

    // pick dummy index different from removed index
    const len = partialTokenizedWords.length;
    let dummyIdx = this.random.rand(len - 1);
    if (dummyIdx === tokenRefRemoveIdx) dummyIdx = (dummyIdx + 1) % len;

    partialTokenizedWords[tokenRefRemoveIdx] =
      this.plan.generatePartialTokenized(
        partialTokenizedWords,
        tokenRefRemoveIdx,
        placementIdx,
        dummyIdx,
      );

    const partialWords = wordsSeqs.map((v) => v.str);
    partialWords[tokenRefRemoveIdx] = this.plan.blankPartialWord(
      partialWords[dummyIdx],
    );

    const binarySeperator = this.plan.binarySeparator(
      symbolExpression.options.type,
    );

    // flatten partial tokenized words into sentence
    const partialTokenizedSentence = partialTokenizedWords
      .map((arr) => arr.join(binarySeperator))
      .join(this.plan.wordSeparator);

    const tokenizedSentence = tokenizedSequenceWords
      .map((w) => w.str)
      .join(this.plan.wordSeparator);

    const testComplex = this.plan.buildTestComplex();

    const expression = this.buildExpresion();

    const instructionWords = this.plan.buildInstructionWords(getToken);

    const res = {
      realMap,
      getReal,
      tokenMap,
      getToken,
      tokenEntries,

      tokenizedWords: tokenizedSequenceWords,
      tokenizedSentence,
      partialTokenizedSentence,
      partialTokenizedWords,

      sentence: ctx.chosen.join(" "),

      sentenceWords: ctx.chosen,
      partialWords,
      wordsSeqs,
      tokenRefRemoveIdx,

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

/*
  Factory helper: build a plan + generator from primitive deps. This is useful
  for tests where you want to easily create controlled PuzzleGenerators.
*/
export function createGeneratorWithPlan(
  random: IRandom,
  mapFactory: IMappingTransfomer,
  ctxFactory: IFactory<PuzzleContext>,
  config: IConfig,
): { plan: PuzzlePlan; generator: PuzzleGenerator } {
  const builder = new PuzzlePlanBuilder(random, config);
  const plan = builder.build(config.level);
  const generator = new PuzzleGenerator(random, mapFactory, ctxFactory, plan);
  return { plan, generator };
}
