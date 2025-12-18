export interface ScanOpts {
  missingWords: boolean;
  multiInput: boolean;
  placementIdx: number;
}

export interface SymbolManagerOpts {
  multiTokens: boolean;
  multiInput: boolean;
}

export type SymbolMutable = [string] | [string, string];

export interface IContextSource {
  next(num: number): boolean;
  read(num: number): SymbolMutable;
  peek(reads: number): null | string;
  isBucket(type: string): boolean;
  atAll(idx: number): string;
  randNot(idx: number, word: string[] | null): string;
  all(): string[];
}
