import { ISymbols, SymbolRaw } from "../interface";
import { SymbolScanner } from "./SymbolScanner";
import { IContextSource, ScanOpts, SymbolManagerOpts } from "./interface";
import { SymbolObj } from "../models/SymbolObj";
import { IRandom } from "../IRandom";

export class SymbolManager {
  static New(
    random: IRandom,
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
    private readonly random: IRandom,
    private readonly source: IContextSource,
    private readonly scanFactory: (op: ScanOpts) => SymbolScanner,
    private readonly options: SymbolManagerOpts,
  ) {}

  public run(placementIdx: number) {
    const scanOpts = {
      // missing words when its multi input
      missingWords: this.options.multiInput && this.options.multiTokens,
      multiInput: this.options.multiInput,
      placementIdx: placementIdx,
    };

    const scanner = this.scanFactory(scanOpts);
    const { totalSymbols, wordsSeqs } = scanner.scan();
    this.random.randOrder(totalSymbols);

    const tokens =
      this.options.multiTokens === this.options.multiInput
        ? this.random.randOrder(totalSymbols.slice())
        : this.buildFlatTokens(totalSymbols.length, placementIdx);

    return {
      totalSymbols,
      wordsSeqs,
      tokens,
    };
  }

  private placementModifier<T extends any[]>(vals: T, placementIdx: number): T {
    if (placementIdx === 0) {
      return vals;
    }
    return vals.reverse() as T;
  }

  private buildFlatTokens(symSize: number, placementIdx: number) {
    const totalWords = this.random.randOrder(this.source.all());
    let tokens: ISymbols[] = [];

    // TODO: when multi input, it takes two words, but then input symbols is <
    // n - if I add each missing word, to account for encode instructions,
    // input symbols > n,  tokens = n.
    const len = this.options.multiTokens ? totalWords.length : symSize;
    for (let i = 0; i < len; i++) {
      let symbols: SymbolRaw;
      if (this.options.multiTokens && this.random.bool()) {
        const idx = this.random.rand(totalWords.length - 1);
        symbols = this.placementModifier(
          [totalWords[i], totalWords[idx]] as [string, string],
          placementIdx,
        );
      } else {
        symbols = [totalWords[i]];
      }
      tokens.push(new SymbolObj(symbols));
    }
    return tokens;
  }
}
