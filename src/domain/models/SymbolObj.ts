import { ISymbols, SymbolRaw } from "../interface";

export class SymbolObj implements ISymbols {
  public readonly str: string;
  constructor(public readonly els: SymbolRaw) {
    const tmp = els.length > 1 ? ` ${els[1]}` : "";
    this.str = els[0] + tmp;
  }
}
