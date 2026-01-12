import {
  SymbolTypeOptions,
  ISymbols,
  InstructionWordType,
  SymbolRaw,
} from "../interface";
import { SymbolMapper } from "../models/SymbolMapper";

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
