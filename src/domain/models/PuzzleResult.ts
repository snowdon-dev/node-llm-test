import { blankWordToken, isFirstCharCapital } from "../characters";
import {
  IExpressionResult,
  InstructionWordType,
  IPrepareResult,
  IPuzzleResult,
  ISymbols,
  SymbolExpression,
  SymbolRaw,
  SymbolTypeOptions,
} from "../interface";

export class PuzzleResult implements IPuzzleResult {
  getToken: (str: string) => ISymbols;
  getReal: (str: string) => ISymbols;
  tokenMap: Readonly<Record<string, ISymbols>>;
  realMap: Readonly<Record<string, ISymbols>>;
  tokenizedWords: ISymbols[];
  tokenizedSentence: string;
  partialTokenizedSentence: string;
  partialTokenizedWords: SymbolRaw[];
  sentence: string;
  sentenceWords: readonly string[];
  partialWords: readonly string[];
  wordsSeqs: ISymbols[];
  correctAnswer: string;
  realAnswer: string;
  expression: Readonly<IExpressionResult>;
  symbolExpression: Readonly<SymbolExpression<SymbolTypeOptions>>;
  instructionWords: InstructionWordType;
  testComplex: {
    identLocationOrder: number;
    identLocationType: number;
    puzzleType: false | "reverse" | "order";
  };

  constructor(options: IPrepareResult) {
    Object.assign(this, options);
  }

  wordTable() {
    const headers = this.wordsSeqs.map((s) => s.str);
    const rows = [
      this.partialTokenizedWords.map((s) => s.join(" ")),
      this.tokenizedWords.map((s) => s.str),
    ];
    return { headers, rows };
  }

  answer(strIn: string) {
    const correctFormat = /^[A-Za-z]+(?: [A-Za-z]+)?$/.test(strIn);
    if (strIn === this.correctAnswer) {
      // if the word equals the correct word. HURRAH
      return {
        exact: true,
        possible: false,
        correctFormat,
      };
    }
    if (correctFormat) {
      const wordSequence = this.getReal(strIn); // token to real
      if (wordSequence === undefined) {
        return { exact: false, possible: false, correctFormat };
      }
      if (this.getToken(wordSequence.str) === undefined) {
        return { exact: false, possible: false, correctFormat };
      }

      // check it completes the sentence
      const idx = this.partialWords.indexOf(blankWordToken);
      const tmpRealWords = [...this.partialWords];

      const realWord = this.sentenceWords[idx];

      if (
        isFirstCharCapital(realWord) !== isFirstCharCapital(wordSequence.str)
      ) {
        return { exact: false, possible: false, correctFormat };
      }

      // insert into the partial sentence
      tmpRealWords.splice(idx, 1, wordSequence.str);
      const charsSet = new Set(
        tmpRealWords.join("").replaceAll(" ", "").toLowerCase().split(""),
      );
      if (charsSet.size !== 26) {
        return { exact: false, possible: false, correctFormat };
      }

      // not true, but potentially true
      // word sequence should be checked to see if it's in the dictionary
      return {
        exact: false,
        possible: true,
        possibleReal: wordSequence,
        correctFormat,
      };
    }

    return { exact: false, possible: false, correctFormat };
  }
}
