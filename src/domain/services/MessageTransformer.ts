import { rotN } from "../characters";
import { IPrepareResult } from "../interface";
import { IRandom } from "../IRandom";
import { LevelsType } from "../levels";
import { Description } from "../models/Description";

function* objectEntries<K extends PropertyKey, V>(
  entries: Iterable<readonly [K, V]>,
): Generator<[K, V], void, unknown> {
  for (const [key, value] of entries) {
    yield [key, value];
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

    const instructionWords = result.instructionWords;

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

    const poorCodingStandards = this.level.POOR_CODING_STANDARDS;
    const lineSource = this.random.randOrder(Object.entries(result.tokenMap));
    const numberOfPartitions = this.level.SPLIT_MAPPING
      ? this.random.rand(
          Math.min(9, Math.max(1, Math.floor(lineSource.length / 2))),
        ) + 1
      : 1;
    const partitionSize = Math.ceil(lineSource.length / numberOfPartitions);

    for (let p = 0; p < numberOfPartitions; p++) {
      const start = p * partitionSize;
      const end = start + partitionSize;
      const partition = lineSource.slice(start, end);

      if (partition.length === 0) continue;

      // TODO: After order randomisation during INSTRUCTION_ORDER, group neighbour values
      parts.push(() => {
        let messages = "";

        if (!isExcludeMappingInfo) {
          if (this.level.SPLIT_MAPPING && !this.level.INSTRUCTION_ORDER) {
            messages += outputter(
              instructionWords.mappingAnonHeader +
                " " +
                instructionWords.characterDigitAlpha[p + 1] +
                ":",
            );
            messages += "\n";
          } else if (!this.level.INSTRUCTION_ORDER) {
            messages += outputter(
              this.description.getTableMappingHeader(instructionWords),
            );
            messages += "\n";
          }
        }

        let lines = "";
        // TODO: index global over partitions, must keep order after randomisation placement?
        for (const [index, [old, newS]] of partition.entries()) {
          const tmpLines: string[] = [];
          tmpLines.push(
            this.description.getMappingMessage(
              old,
              newS.str,
              symbol,
              result.expression.expressionDefinition,
              index,
              result.testComplex.identLocationType,
              poorCodingStandards,
              result.testComplex.puzzleType,
            ),
          );

          const lastLine = index !== partition.length - 1;

          const symbols = "!@£$%^&*(){}:<>?".split("");
          if (this.level.MAPPING_REDUNDANT && this.random.bool()) {
            const bitmask = this.random.rand(0xfffffff);
            tmpLines.push(
              this.description.getMappingMessage(
                old,
                Array.from(
                  { length: 4 + this.random.rand(3) },
                  (i: number) => symbols[(bitmask >> (i * 4)) & 0b1111],
                ).join(""),
                symbol,
                result.expression.expressionDefinition,
                index,
                result.testComplex.identLocationType,
                poorCodingStandards,
                result.testComplex.puzzleType,
              ),
            );

            this.random.randOrder(tmpLines);
          }
          lines += tmpLines.join("\n");
          if (lastLine) {
            lines += "\n";
          }
        }

        messages += outputter(lines);
        return messages;
      });
    }

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

    const preamblePart: string[] = [];

    if (hasRandomShift && !this.level.OUTPUT_SHIFT_EXLCUDE_DETAILS) {
      preamblePart.push(
        `The following message [a-zA-Z] characters have been encoded with ROT ${instructionWords.characterDigitAlpha[randomShift]}`,
      );
    }

    if (this.level.REASNING_MODE) {
      preamblePart.push(
        ...instructionWords.instructionReasoning.map(outputter),
      );
    } else {
      preamblePart.push(
        ...instructionWords.instructionsNonReasoning.map(outputter),
      );
    }

    const genPreamblePart = () =>
      preamblePart.map((value) => "- " + value + ".").join("\n");
    parts = [genPreamblePart].concat(
      randomOrder ? this.random.randOrder(parts) : parts,
    );

    if (this.level.ANSWER_INCEPTION) {
      const iter = objectEntries(lineSource);
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
        token = this.result.getToken(realTmp).str;
        real = this.result.getReal(token).str;
      }

      const num = this.random.rand(2) + 1;

      const createBackAndForth = (
        real: string,
        isFirst: boolean,
        trusted: boolean,
      ) => {
        const userMsg = trusted
          ? instructionWords.inceptionTrustedIncorrect + ` ${real}.` + "\n"
          : instructionWords.inceptionUser + ` ${real}` + ".\n";
        return (
          (!isFirst
            ? instructionWords.inceptionUserOneIdent +
              ": " +
              instructionWords.inceptionWait +
              ".\n"
            : "") +
          instructionWords.inceptionUserOneIdent +
          ": " +
          (instructionWords.inceptionSystem + ` ${real}` + ".\n") +
          instructionWords.inceptionUserTwoIdent +
          ": " +
          userMsg
        );
      };

      parts.push(() => {
        let str = instructionWords.inceptionIntro + ".\n";
        const trusted = this.random.bool();
        const end = real !== token ? num : 1;

        for (let i = 0; i < end; i++) {
          const last = i === end - 1;
          const inAgreement =
            !trusted && real === token ? true : trusted && !last;
          const first = i === 0;
          str +=
            last || i % 2 === 0
              ? createBackAndForth(real, first, inAgreement)
              : createBackAndForth(token, first, inAgreement);
        }

        return outputter(str);
      });
    }

    return parts;
  }
}
