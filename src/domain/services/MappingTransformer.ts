import { IMappingTransfomer } from "../IMappingTransfomer";
import { ISymbols } from "../interface";
import { IRandom } from "../IRandom";
import { PuzzleContext } from "../models/PuzzleContext";
import { ContextSource } from "../reader/ContextSource";
import { SymbolManagerOpts } from "../reader/interface";
import { SymbolManager } from "../reader/SymbolManager";

export class MappingTransformer implements IMappingTransfomer {
  constructor(
    private readonly random: IRandom,
    private readonly opts: SymbolManagerOpts,
  ) {}

  public create(context: PuzzleContext, depth: number, placementIdx: number) {
    const source = new ContextSource(context);
    const symbols = SymbolManager.New(this.random, source, this.opts);
    const symResult = symbols.run(placementIdx);

    const tokenMap: Record<string, ISymbols> = Object.create(null);
    const realMap: Record<string, ISymbols> = Object.create(null);

    const { totalSymbols, tokens, wordsSeqs } = symResult;
    const count = totalSymbols.length;
    const maxTokenIdx = tokens.length - 1;

    for (let i = 0; i < count; i++) {
      const symbolObj = totalSymbols[i];
      const tokenObj = tokens[maxTokenIdx - i];

      tokenMap[symbolObj.str] = tokenObj;
      realMap[tokenObj.str] = symbolObj;
    }

    const createGetter = (baseMap: Readonly<Record<string, ISymbols>>) => {
      if (depth <= 1) {
        return (str: string) => baseMap[str];
      }

      const fastCache: Record<string, ISymbols> = Object.create(null);
      const keys = Object.keys(baseMap);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const key = keys[i];
        let obj = baseMap[key];
        for (let n = 1; n < depth; n++) {
          if (obj) {
            obj = baseMap[obj.str];
          }
        }
        if (obj) {
          fastCache[key] = obj;
        }
      }

      return (str: string) => fastCache[str];
    };

    return {
      wordsSeqs,
      tokenMap,
      realMap,
      getToken: createGetter(tokenMap),
      getReal: createGetter(realMap),
    };
  }
}
