import { rotN } from "../characters";
import { IPrepareResult } from "../interface";
import { IRandom } from "../IRandom";
import { LevelsType } from "../levels";
import { Description } from "../models/Description";

function* objectEntries<T extends object>(
  obj: T,
): Generator<[keyof T, T[keyof T]], void, unknown> {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      // TypeScript needs a small cast because `for...in` keys are strings
      yield [key as keyof T, obj[key as keyof T]];
    }
  }
}

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
            this.level.HARD_SCHEMA,
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

    if (this.level.ANSWER_INCEPTION) {
      const iter = objectEntries(this.result.tokenMap);
      let target = iter.next();
      if (this.result.realAnswer === target.value?.[0]!) {
        target = iter.next();
      }
      const realTmp = target.value?.[0]!;
      const tokenTmp = target.value?.[1].str;
      if (tokenTmp === undefined) {
        throw new TypeError();
      }

      let token = tokenTmp,
        real = realTmp;
      if (this.level.ENCODE_INSTRUCTIONS) {
        token = this.result.tokenMap[realTmp].str;
        real = this.result.realMap[token].str;
      }

      const num = this.random.rand(2) + 1;

      const createBackAndForth = (real: string, isLast: boolean) => {
        return (
          (!isLast ? instructionWords.inceptionWait + ".\n" : "") +
          instructionWords.inceptionSystem +
          ` ${real}` +
          ".\n" +
          instructionWords.inceptionUser +
          ` ${real}.` +
          "\n"
        );
      };

      parts.push(() => {
        let str = instructionWords.inceptionIntro + ".\n";

        if (real !== token) {
          for (let i = 0; i < num; i++) {
            const last = i === i - 1;
            str +=
              last || i % 2 === 0
                ? createBackAndForth(real, last)
                : createBackAndForth(token, last);
          }
        }

        return outputter(str);
      });
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
