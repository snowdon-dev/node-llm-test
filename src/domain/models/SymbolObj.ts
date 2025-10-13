import { spacingChars } from "../characters";
import { ISymbols, SymbolRaw } from "../interface";

export class SymbolObj implements ISymbols {
  public readonly str: string;
  constructor(public readonly els: SymbolRaw) {
    this.str = els.join(spacingChars);
  }
}
