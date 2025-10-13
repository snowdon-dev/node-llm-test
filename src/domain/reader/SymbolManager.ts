import { ISymbols, SymbolRaw } from "../interface";
import { SymbolScanner } from "./SymbolScanner";
import { RandomSource } from "../../infra/random";
import { IContextSource, ScanOpts, SymbolManagerOpts } from "./interface";
import { SymbolObj } from "../models/SymbolObj";

export class SymbolManager {
  static New(
    random: RandomSource,
    source: IContextSource,
    options: SymbolManagerOpts,
  ) {
    return new SymbolManager(
      random,
      source,
      (op: ScanOpts) => new SymbolScanner(random, source, op),
      options,
    );
  }

  constructor(
    private readonly random: RandomSource,
    private readonly source: IContextSource,
    private readonly scanFactory: (op: ScanOpts) => SymbolScanner,
    private readonly options: SymbolManagerOpts,
  ) {}

  public run() {
    const scanOpts = {
      // missing words when its multi input
      missingWords: this.options.multiInput && this.options.multiTokens,
      multiInput: this.options.multiInput,
    };

    const scanner = this.scanFactory(scanOpts);
    const { totalSymbols, wordsSeqs } = scanner.scan();
    this.random.randOrder(totalSymbols);

    const tokens =
      this.options.multiTokens === this.options.multiInput
        ? this.random.randOrder(totalSymbols.slice())
        : this.buildFlatTokens(totalSymbols.length);

    return {
      totalSymbols,
      wordsSeqs,
      tokens,
    };
  }

  private buildFlatTokens(symSize: number) {
    const totalWords = this.random.randOrder(this.source.all());
    let tokens: ISymbols[] = [];

    // TODO: read symbols until token length
    // symbols may be greater than total words
    // when not both sides, where n is totalSymbols.length
    //  if multiInput size < n , len is n
    //  if miltiTokens size < n, len is n | BROKEN
    //
    // TODO: when multi input, it takes two words, but then input symbols is <
    // n - if I add each missing word, to account for encode instructions,
    // input symbols > n,  tokens = n.
    const len = this.options.multiTokens ? totalWords.length : symSize;
    for (let i = 0; i < len; i++) {
      let symbols: SymbolRaw;
      if (this.options.multiTokens && this.random.bool()) {
        const idx = this.random.rand(totalWords.length - 1);
        symbols = [totalWords[i], totalWords[idx]];
      } else {
        symbols = [totalWords[i]];
      }
      tokens.push(new SymbolObj(symbols));
    }
    return tokens;
  }
}
