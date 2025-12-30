import { ISymbols } from "./interface";
import { PuzzleContext } from "./models/PuzzleContext";

export interface IMappingTransfomer {
  create(
    context: PuzzleContext,
    depth: number,
    placementIdx: number,
  ): {
    wordsSeqs: ISymbols[];
    tokenMap: Record<string, ISymbols>;
    realMap: Record<string, ISymbols>;
    tokenEntries: [string, ISymbols][];
    getToken: (str: string) => ISymbols;
    getReal: (str: string) => ISymbols;
  };
}
