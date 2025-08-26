export interface IPrepareResult {
  /** Map from the real to the tokenizedWords */
  tokenMap: Readonly<Record<string, string>>;
  /** Map from the tokenized words to the real words */
  realMap: Readonly<Record<string, string>>;

  tokenizedWords: Readonly<string[][]>;

  /** Sentence as tokens (symbols) */
  tokenizedSentence: Readonly<string>;

  /** Encoding after symbol expression */
  partialTokenizedSentence: Readonly<string>;
    
  /** Token sequence chunks */
  partialTokenizedWords: Readonly<string[][]>;

  sentence: Readonly<string>;
  sentenceWords: Readonly<string[]>;
  partialWords: Readonly<string[]>;

  /** Word sequence chunks */
  wordsSeqs: string[][];

  correctAnswer: Readonly<string>;
  realAnswer: Readonly<string>;

  expression: Readonly<IExpressionResult>;
  symbolExpression: Readonly<SymbolExpression<SymbolTypeOptions>>;
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
  mapper: (w: string[]) => string[];
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
