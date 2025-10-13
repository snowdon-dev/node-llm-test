import { ISymbols } from "../interface";
import { IContextSource } from "./interface";
import { SymbolObj } from "../models/SymbolObj";
import { IRandom } from "../IRandom";

export class SymbolScanner {
  private readonly used: Set<string>;
  private readonly find: (words: ISymbols, _: string | null) => ISymbols[];

  constructor(
    private readonly random: IRandom,
    private readonly source: IContextSource,
    private readonly options: Readonly<{
      missingWords: boolean;
      multiInput: boolean;
    }>,
  ) {
    this.used = new Set<string>();
    this.find = this.makeFind();
  }

  scan() {
    let totalSymbols: SymbolObj[] = [];

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

  private makeFind() {
    return this.options.missingWords ? this.findMissing : this.findNull;
  }

  private findMissing(words: ISymbols, nextWord: null | string) {
    const tmp = this.findNull(words, nextWord);
    const candidates =
      words.els.length === 2
        ? this.readFromTwo(tmp, words)
        : this.pickMissingSymbol(tmp, words, nextWord);
    return candidates;
  }

  private findNull(words: ISymbols, _: null | string) {
    return [words];
  }

  private readFromTwo(tmp: ISymbols[], words: ISymbols) {
    for (let i = 0; i < words.els.length; i++) {
      tmp.push(new SymbolObj([words.els[i]]));
    }
    return tmp;
  }

  private pickMissingSymbol(
    tmp: ISymbols[],
    words: ISymbols,
    nextWord: null | string,
  ): ISymbols[] {
    const idx = this.random.rand(this.source.all().length - 1);
    const consumedWords = [nextWord].filter((v) => v !== null);
    const other = this.source.randNot(idx, consumedWords);

    consumedWords.push(other);
    const secondOther = this.source.randNot(idx, consumedWords);
    const obj: ISymbols = new SymbolObj([words.els[0], other]);
    tmp.push(obj);
    const obj2: ISymbols = new SymbolObj([words.els[0], secondOther]);
    tmp.push(obj2);

    return tmp;
  }
}
