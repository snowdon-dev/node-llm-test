export interface ISymbols {
  readonly str: string;
  readonly els: SymbolRaw;
}

export type SymbolRaw = readonly [string] | readonly [string, string];

export type InstructionWordType = Record<string, any>;

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

  readonly expression: Readonly<IExpressionResult>;
  readonly symbolExpression: Readonly<SymbolExpression<SymbolTypeOptions>>;

  readonly instructionWords: InstructionWordType;

  /** Persistent rules */
  testComplex: {
    identLocationOrder: number;
    identLocationType: number;
    puzzleType: false | "reverse" | "order";
  };
}

export interface IPuzzleResult extends IPrepareResult {
  wordTable(): { headers: string[]; rows: string[][] };
  answer(input: string):
    | {
        exact: boolean;
        possible: boolean;
        possibleReal?: undefined;
      }
    | {
        exact: boolean;
        possible: boolean;
        possibleReal: ISymbols;
      };
}

export interface ILLMTest {
  result(
    inputWords: readonly string[],
    pangrams: readonly string[],
  ): IPuzzleResult;
  print(result: IPuzzleResult, output: (outs: string) => unknown): void;
  answer(
    result: IPuzzleResult,
    strIn: string,
  ): { exact: boolean; possible: boolean };
  printWork(result: IPuzzleResult): string;
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
