export interface IPrepareResult {
  /** Map from the real to the tokenizedWords */
  tokenMap: Record<string, string>;
  /** Map from the tokenized words to the real words */
  realMap: Record<string, string>;

  tokenizedWords: string[];
  tokenizedSentence: string;
  partialTokenizedSentence: string;
  //partialTokenizedWords: string[];

  sentence: string;
  sentenceWords: string[];
  partialWords: string[];

  correctAnswer: string;
  realAnswer: string;

  expression: IExpressionResult;
  symbolExpression: SymbolExpression<SymbolTypeOptions>;
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
