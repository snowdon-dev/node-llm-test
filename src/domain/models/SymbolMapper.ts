import { SymbolTypeOptions, SymbolExpression, SymbolRaw } from "../interface";

export interface SymbolMapper<T extends SymbolTypeOptions>
  extends SymbolExpression<T> {
  mapper: (w: SymbolRaw) => SymbolRaw;
}
