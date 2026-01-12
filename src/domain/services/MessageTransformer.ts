import { characterDigitAlpha, rotN } from "../characters";
import { IPrepareResult } from "../interface";
import { IRandom } from "../IRandom";
import { LevelsType } from "../levels";
import { Description } from "../models/Description";

function* objectEntries<K extends PropertyKey, V>(
  entries: readonly (readonly [K, V])[],
  startPos: number = 0,
): Generator<[K, V], void, unknown> {
  let i = startPos;
  yield entries[i] as [K, V];
  yield entries[(i + 1) % entries.length] as [K, V];
}

const premambleWords = {
  instructionReasoning: ["Think carefully and respond only when confident"],
  instructionsNonReasoning: [
    "Respond with the final answer only",
    "No reasoning",
    "No steps",
    "No explanations",
    "Using flash mode",
  ],
} as const;

export class MessageTransfomer {
  constructor(
    private readonly random: IRandom,
    private readonly simplerng: (num: number) => number,
    private readonly description: Description,
    private readonly result: IPrepareResult,
    private readonly level: LevelsType,
  ) {}

  protected static SYMBOLS = "!@£$%^&*(){}:<>?".split("");

  transfom() {
    const result = this.result;
    const symbol = result.expression.equalSymbol;
    const randomOrder = this.level.INSTRUCTION_ORDER;

    const hasRandomShift = this.level.OUTPUT_SHIFT;
    const randomShift = this.simplerng(25);
    const outputter = hasRandomShift
      ? (str: string) => rotN(str, randomShift)
      : (str: string) => str;
    let parts: ((() => string) | Symbol)[] = [];

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
    const lineSource = this.random.randOrder(result.tokenEntries.slice());
    const maxPartitions =
      lineSource.length <= 6 ? 0 : lineSource.length <= 11 ? 1 : 3;
    const numberOfPartitions = this.level.MAPPING_SPLIT
      ? this.random.rand(maxPartitions) + 1
      : 1;
    const partitionSize = Math.ceil(lineSource.length / numberOfPartitions);

    const partCallables: (() => string)[] = [];
    const partSymbol = Symbol();

    const globalIndex = this.random.bool();
    for (let p = 0; p < numberOfPartitions; p++) {
      const start = p * partitionSize;

      // TODO: After order randomisation during INSTRUCTION_ORDER, group neighbour values
      const partCallable = () => {
        let messages = "";

        if (!isExcludeMappingInfo) {
          if (this.level.MAPPING_SPLIT && !this.level.INSTRUCTION_ORDER) {
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
        const actualEnd = Math.min(start + partitionSize, lineSource.length);
        const partitionCount = actualEnd - start;

        for (let index = 0; index < partitionCount; index++) {
          const currentIndex = start + index;
          const [old, newS] = lineSource[currentIndex];
          const lastLine = index !== partitionCount - 1;
          const usedIndex = globalIndex ? currentIndex : index;
          const tmpLines: string[] = [];
          tmpLines.push(
            this.description.getMappingMessage(
              old,
              newS.str,
              symbol,
              result.expression.expressionDefinition,
              usedIndex,
              result.testComplex.identLocationType,
              poorCodingStandards,
              result.testComplex.puzzleType,
            ),
          );

          if (this.level.MAPPING_REDUNDANT && this.random.bool()) {
            const bitmask = this.random.rand(0xfffffff);
            const tokenOrMapping = this.random.bool();
            const redundantChars = Array.from(
              { length: 4 + this.random.rand(3) },
              (i: number) =>
                MessageTransfomer.SYMBOLS[(bitmask >> (i * 4)) & 0xf],
            ).join("");
            const [newOld, newNew] = tokenOrMapping
              ? [old, redundantChars]
              : [redundantChars, old];
            tmpLines.push(
              this.description.getMappingMessage(
                newOld,
                newNew,
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
      };

      parts.push(partSymbol);
      partCallables.push(partCallable);
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
        `The following message [a-zA-Z] characters have been encoded with ROT ${characterDigitAlpha[randomShift]}`,
      );
    }

    if (this.level.REASNING_MODE) {
      preamblePart.push(...premambleWords.instructionReasoning);
    } else {
      preamblePart.push(...premambleWords.instructionsNonReasoning);
    }
    const genPreamblePart = () =>
      preamblePart.map((value) => "- " + value + ".").join("\n");

    // build the template parts
    const partsStart: (Symbol | (() => string))[] = [genPreamblePart];
    parts = partsStart.concat(
      randomOrder ? this.random.randOrder(parts) : parts,
    );

    // inject the mapping table callables
    for (let i = partsStart.length, cIdx = 0; i < parts.length; i++) {
      if (parts[i] !== partSymbol) continue;
      parts[i] = partCallables[cIdx++];
    }

    if (this.level.ANSWER_INCEPTION) {
      const iter = objectEntries(
        lineSource,
        this.random.rand(lineSource.length - 1),
      );
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

    return parts as (() => string)[];
  }
}
