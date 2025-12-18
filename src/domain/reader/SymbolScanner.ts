import { ISymbols } from "../interface";
import { IContextSource, ScanOpts } from "./interface";
import { SymbolObj } from "../models/SymbolObj";
import { IRandom } from "../IRandom";

export class SymbolScanner {
  private readonly used: Set<string>;
  private readonly find: (words: ISymbols, _: string | null) => ISymbols[];

  constructor(
    private readonly random: IRandom,
    private readonly source: IContextSource,
    private readonly options: Readonly<ScanOpts>,
  ) {
    this.used = new Set<string>();
    this.find = this.prepareFind();
  }

  scan() {
    const totalSymbols: SymbolObj[] = [];

    const reader = () => {
      const step = this.options.multiInput ? this.random.rand(1) + 1 : 1;
      const words = this.source.read(step);
      const next = this.source.peek(words.length);
      const symbol = new SymbolObj(words);
      this.source.next(words.length);
      return [symbol, next] as const;
    };

    while (this.source.isBucket("other")) {
      const [symbol, next] = reader();
      const candidates = this.find(symbol, next);
      for (let i = 0; i < candidates.length; i++) {
        const tmp = candidates[i];
        totalSymbols.push(tmp);
      }
    }

    while (this.source.isBucket("active")) {
      const [symbol, next] = reader();
      if (this.used.has(symbol.str)) continue;
      const candidates = this.find(symbol, next);
      for (let i = 0; i < candidates.length; i++) {
        const tmp = candidates[i];
        if (i > 0 && this.used.has(tmp.str)) continue;
        totalSymbols.push(tmp);
        this.used.add(tmp.str);
      }
    }

    const wordsSeqs: ISymbols[] = [];
    while (this.source.isBucket("chosen")) {
      const [symbol, next] = reader();
      wordsSeqs.push(symbol);
      if (this.used.has(symbol.str)) continue;
      const candidates = this.find(symbol, next);
      for (let i = 0; i < candidates.length; i++) {
        const tmp = candidates[i];
        if (i > 0 && this.used.has(tmp.str)) continue;
        totalSymbols.push(tmp);
        this.used.add(tmp.str);
      }
    }

    return { totalSymbols, wordsSeqs };
  }

  private prepareFind() {
    return this.options.missingWords ? this.findMissing : this.findNull;
  }

  private findMissing(words: ISymbols, nextWord: null | string) {
    const tmp = this.findNull(words);
    const candidates =
      words.els.length === 2
        ? this.readFromTwo(tmp, words)
        : this.pickMissingSymbol(tmp, words, nextWord);
    return candidates;
  }

  private findNull(words: ISymbols) {
    return [words];
  }

  private readFromTwo(tmp: ISymbols[], words: ISymbols) {
    for (let i = 0; i < words.els.length; i++) {
      tmp.push(new SymbolObj([words.els[i]]));
    }
    return tmp;
  }

  private placementModifier<T extends any[]>(vals: T): T {
    if (this.options.placementIdx === 0) {
      return vals;
    }
    return vals.reverse() as T;
  }

  private pickMissingSymbol(
    tmp: ISymbols[],
    words: ISymbols,
    nextWord: null | string,
  ): ISymbols[] {
    const idx = this.random.rand(this.source.all().length - 1);
    const consumedWords: string[] = [];
    if (nextWord !== null) consumedWords.push(nextWord);
    const other = this.source.randNot(idx, consumedWords);
    consumedWords.push(other);
    let vals: [string, string] = [words.els[0], other];
    tmp.push(new SymbolObj(this.placementModifier(vals)));
    const secondOther = this.source.randNot(idx, consumedWords);
    vals = [words.els[0], secondOther];
    tmp.push(new SymbolObj(this.placementModifier(vals)));

    return tmp;
  }
}
