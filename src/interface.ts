export interface ISymbols {
  readonly str: string;
  readonly els: SymbolRaw;
}
export type SymbolRaw = readonly [string] | readonly [string, string];

export interface IPrepareResult {
  /** Map from the real to the tokenizedWords */
  tokenMap: Readonly<Record<string, ISymbols>>;
  /** Map from the tokenized words to the real words */
  realMap: Readonly<Record<string, ISymbols>>;

  tokenizedWords: ISymbols[];

  /** Sentence as tokens (symbols) */
  readonly tokenizedSentence: string;

  /** Encoding after symbol expression */
  readonly partialTokenizedSentence: string;

  /** Token sequence chunks */
  readonly partialTokenizedWords: SymbolRaw[];

  readonly sentence: string;
  readonly sentenceWords: readonly string[];
  readonly partialWords: readonly string[];

  /** Word sequence chunks */
  readonly wordsSeqs: ISymbols[];

  readonly correctAnswer: string;
  readonly realAnswer: string;

  expression: Readonly<IExpressionResult>;
  symbolExpression: Readonly<SymbolExpression<SymbolTypeOptions>>;

  /** Persistent rules */
  testComplex: {
    identLocationOrder: number;
    identLocationType: number;
    puzzleType: false | "reverse" | "order";
    rand: (num: number) => number;
  };
}

export interface ILLMTest {
  print(output: (outs: string) => unknown): void;
  answer(strIn: string): { exact: boolean; possible: boolean };
}

export interface IExpressionResult {
  expressionDefinition: ExpressionDefinitionType;
  expressionType: string;
  equalSymbol: string;
}

export interface RotOptions {
  type: "rot";
  rotNNum: number;
}

export interface BinaryOptions {
  type: "binary";
}

export interface BinaryRotOptions {
  type: "binaryrot";
  rotNNum: number;
}
export interface NoneOptions {
  type: "none";
}

// Discriminated union
export type SymbolTypeOptions =
  | NoneOptions
  | RotOptions
  | BinaryOptions
  | BinaryRotOptions;

export type SymbolRotOptions = RotOptions | BinaryRotOptions;

export interface SymbolExpression<T extends SymbolTypeOptions> {
  options: T;
}

export type ExpressionDefinitionType = [
  ExpressionPart,
  ExpressionPart,
  ExpressionPart,
];

export enum ExpressionPart {
  NEW_OPARAND,
  OPERATOR,
  OLD_OPARAND,
}
