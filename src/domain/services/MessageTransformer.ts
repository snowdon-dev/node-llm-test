import { rotN } from "../characters";
import { IPrepareResult } from "../interface";
import { IRandom } from "../IRandom";
import { LevelsType } from "../levels";
import { Description } from "../models/Description";

export class MessageTransfomer {
  constructor(
    private readonly random: IRandom,
    private readonly simplerng: (num: number) => number,
    private readonly description: Description,
    private readonly result: IPrepareResult,
    private readonly level: LevelsType,
  ) {}

  transfom() {
    const result = this.result;
    const symbol = result.expression.equalSymbol;
    const randomOrder = this.level.INSTRUCTION_ORDER;

    const hasRandomShift = this.level.OUTPUT_SHIFT;
    const randomShift = this.simplerng(25);
    const outputter = hasRandomShift
      ? (str: string) => rotN(str, randomShift)
      : (str: string) => str;
    let parts: (() => string)[] = [];

    let instructionWords = result.instructionWords;

    const isMappingPuzzle = this.level.MAPPING_INFO_PUZZLE;

    const isExcludeMappingInfo = this.level.EXCLUDE_MAPPING_INFO;

    parts.push(() =>
      outputter(
        this.description
          .getInitialDescription(
            symbol,
            result.expression.expressionDefinition,
            result.symbolExpression,
            isExcludeMappingInfo,
            instructionWords,
            isMappingPuzzle,
            result.testComplex.identLocationOrder,
          )
          .join("\n"),
      ),
    );

    parts.push(() => {
      let messages: string = "";
      const poorCodingStandards = this.level.POOR_CODING_STANDARDS;

      if (!isExcludeMappingInfo) {
        messages += outputter(
          this.description.getTableMappingHeader(instructionWords),
        );
        messages += "\n";
      }

      const lineSource = this.random.randOrder(Object.entries(result.tokenMap));
      let lines = "";
      for (const [index, [old, newS]] of lineSource.entries()) {
        lines += this.description.getMappingMessage(
          old,
          newS.str,
          symbol,
          result.expression.expressionDefinition,
          index,
          result.testComplex.identLocationType,
          poorCodingStandards,
          result.testComplex.puzzleType,
        );
        if (index !== lineSource.length - 1) lines += "\n";
      }
      messages += outputter(lines);
      return messages;
    });

    parts.push(() =>
      outputter(
        this.description
          .getInstructionsMessage(
            this.level.INDIRECT_SYMBOLS,
            result.instructionWords,
            randomOrder,
            this.level.EASY_SCHEMA,
          )
          .join("\n"),
      ),
    );

    parts.push(() =>
      outputter(
        this.description.getSymbolisedSentenceOutput(
          result.partialTokenizedSentence,
          instructionWords,
        ),
      ),
    );

    if (randomOrder) {
      parts = this.random
        .randOrder(parts.map((_, i) => i))
        .map((target) => parts[target]);
    }

    if (hasRandomShift && !this.level.OUTPUT_SHIFT_EXLCUDE_DETAILS) {
      parts.push(
        () =>
          `The following message [a-zA-Z] characters have been encoded with ROT ${instructionWords.characterDigitAlpha[randomShift]}:\n`,
      );
    }

    return parts;
  }
}
