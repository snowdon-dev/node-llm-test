import {
  ExpressionPart,
  InstructionWordType,
  SymbolExpression,
  SymbolRotOptions,
  SymbolTypeOptions,
} from "../interface";
import { IRandom } from "../IRandom";

const computeMathExpression = (n: number, d: number) =>
  Math.floor((n * 7) / d) % 2;

type Delm = { opening: string; closing: string };
const delms: Delm[] = [
  { opening: "'", closing: "'" },
  { opening: "`", closing: "`" },
  { opening: '"', closing: '"' },
  { opening: "(", closing: ")" },
  { opening: "()", closing: "()" },
  { opening: "[", closing: "]" },
  { opening: "[[", closing: "]]" },
  { opening: "[[", closing: "]]" },
];

export class Description {
  constructor(private readonly random: IRandom) {}

  getMappingMessage(
    oldS: string,
    newS: string,
    symbol: string,
    expressionDefinition: ExpressionPart[],
    i: number,
    identLocation: number,
    poorCodingStandards: boolean,
    expressionChange: false | "reverse" | "order",
  ): string {
    const { opening, closing } = poorCodingStandards
      ? delms[Math.floor(Math.random() * 3)]
      : delms[0];

    const parts = {
      [ExpressionPart.NEW_OPARAND]: `${opening}${newS}${closing}`,
      [ExpressionPart.OLD_OPARAND]: `${opening}${oldS}${closing}`,
      [ExpressionPart.OPERATOR]: `${symbol}`,
    };

    const shouldChangeOrder = () =>
      computeMathExpression(i, 3) !== identLocation;

    let expression = expressionDefinition.slice();
    if (expressionChange === "order" && shouldChangeOrder()) {
      const finder = (part: ExpressionPart) => (value: ExpressionPart) =>
        value === part;

      const newIdx = expressionDefinition.findIndex(
        finder(ExpressionPart.NEW_OPARAND),
      );
      const oldIdx = expressionDefinition.findIndex(
        finder(ExpressionPart.OLD_OPARAND),
      );
      [expression[newIdx], expression[oldIdx]] = [
        expression[oldIdx],
        expression[newIdx],
      ];
    }

    let build = expression.map((key) => parts[key]);

    if (expressionChange === "reverse" && shouldChangeOrder()) {
      build = build.reverse();
    }

    build.splice(1, 0, " ");
    build.splice(3, 0, " ");

    return build.join("");
  }

  getInitialDescription(
    symbol: string,
    expressionDefinition: ExpressionPart[],
    symbolExpression: SymbolExpression<SymbolTypeOptions>,
    excludeMappingInfo: boolean = false,
    instructionWords: InstructionWordType,
    isMappingPuzzle: boolean,
    identLocation: number,
  ): string[] {
    const order = expressionDefinition
      .map((item) => {
        switch (item) {
          case ExpressionPart.NEW_OPARAND:
            return instructionWords.symbolIndent.e;
          case ExpressionPart.OLD_OPARAND:
            return instructionWords.symbolIndent.d;
          case ExpressionPart.OPERATOR:
            return null;
        }
      })
      .filter((v) => v !== null);

    let symbolExpMsg: string;
    const msgStart = instructionWords.symbolEncoding;
    const getRotChars = (s: SymbolExpression<SymbolRotOptions>) =>
      instructionWords.characterDigitAlpha[s.options.rotNNum];
    switch (symbolExpression.options.type) {
      case "none": {
        symbolExpMsg = "";
        break;
      }
      case "rot": {
        symbolExpMsg = `${msgStart} ${instructionWords.encodingIdent.rot} ${getRotChars(symbolExpression as any)}`;
        break;
      }
      case "binary": {
        symbolExpMsg = `${msgStart} ${instructionWords.encodingIdent.binary}`;
        break;
      }
      case "binaryrot": {
        symbolExpMsg = `${msgStart} ${instructionWords.encodingIdent.rot} ${getRotChars(symbolExpression as any)} ${instructionWords.multiEncodings} ${instructionWords.encodingIdent.binary}`;
        break;
      }
    }

    let mappingDelm = `${instructionWords.mappingDetails.start} '${symbol}' ${instructionWords.mappingDetails.ending}`;

    let mappingDetails: string | null =
      `${instructionWords.mappingDetails.excludeStart} ${order[0]} ${instructionWords.mappingDetails.excludeEnd}`;

    if (isMappingPuzzle) {
      const puzzleIdent =
        instructionWords.mappingDetails.puzzleIdent[identLocation];
      mappingDetails = `${instructionWords.mappingDetails.puzzleStart}. ${instructionWords.mappingDetails.excludeStart} ${order[0]} ${instructionWords.mappingDetails.puzzleEnd} ${puzzleIdent}`;
    }

    if (excludeMappingInfo) {
      mappingDetails = null;
    }

    const lines: string[] = [];
    // remove? too descriptive
    //"The following describes a puzzle. " +
    //"To complete the game you must figure out the missing word, without asking any questions.\n\n" +
    lines.push(instructionWords.introMsg);
    symbolExpMsg !== "" && lines.push(symbolExpMsg);
    lines.push(mappingDelm);
    lines.push(instructionWords.mappingDetails.delemiter);
    mappingDetails !== null && lines.push(mappingDetails);
    lines.push(instructionWords.snowdondevident);

    return lines.map((line) => line + ".");
  }

  getTableMappingHeader(instructionWords: InstructionWordType): string {
    return instructionWords.mappingHeader + ":";
  }

  getInstructionsMessage(
    indirectSymbols: boolean,
    instructionWords: InstructionWordType,
    random: boolean,
  ): string[] {
    const instructions: string[] = [...instructionWords.all];
    if (indirectSymbols) {
      instructions.push(...instructionWords.indirect);
    }

    const list = instructions.map((l) => "- " + l);

    if (random !== false) {
      this.random.randOrder(list);
    }

    return [
      instructionWords.instructionIntro.join(".\n") + ":",
      list.join("\n"),
    ];
  }

  getSymbolisedSentenceOutput(
    partialTokenizedSentence: string,
    instructionWords: InstructionWordType,
  ): string {
    return (
      instructionWords.identSymbolSentence + ":\n" + partialTokenizedSentence
    );
  }
}
