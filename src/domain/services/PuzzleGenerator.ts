import { equalSymblsSet } from "../characters";
import {
  ISymbols,
  SymbolRaw,
  IExpressionResult,
  ExpressionPart,
  ExpressionDefinitionType,
} from "../interface";
import { PuzzleResult } from "../models/PuzzleResult";
import { IRandom, RandMaxRangeCallable } from "../IRandom";
import { IMappingTransfomer } from "../IMappingTransfomer";
import { IFactory } from "../IFactory";
import { PuzzleContext } from "../models/PuzzleContext";
import { PuzzlePlan } from "./PuzzlePlan";
import { PuzzlePlanBuilder } from "./PuzzlePlanBuilder";
import { IConfig } from "../IConfig";

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
    let dummyIdx = this.random.rand(len - 2);
    if (dummyIdx >= tokenRefRemoveIdx) dummyIdx = dummyIdx + 1;

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
  const plan = builder.build();
  const generator = new PuzzleGenerator(random, mapFactory, ctxFactory, plan);
  return { plan, generator };
}
