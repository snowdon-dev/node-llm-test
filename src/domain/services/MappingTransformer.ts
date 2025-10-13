import { ISymbols } from "../interface";
import { IRandom } from "../IRandom";
import { PuzzleContext } from "../models/PuzzleContext";
import { ContextSource } from "../reader/ContextSource";
import { SymbolManagerOpts } from "../reader/interface";
import { SymbolManager } from "../reader/SymbolManager";

export class MappingTransformer {
  constructor(
    private random: IRandom,
    private opts: SymbolManagerOpts,
  ) {}

  public create(context: PuzzleContext) {
    const source = new ContextSource(context);
    const symbols = SymbolManager.New(this.random, source, this.opts);
    const symResult = symbols.run();

    const tokenMap: Record<string, ISymbols> = Object.create(null);
    const realMap: Record<string, ISymbols> = Object.create(null);

    const { totalSymbols } = symResult;

    const totalTokens = symResult.tokens;

    for (let i = 0; i < totalSymbols.length; i++) {
      const symbolObj = totalSymbols[i];
      const tokenObj = totalTokens[totalTokens.length - 1 - i];

      tokenMap[symbolObj.str] = tokenObj;
      realMap[tokenObj.str] = symbolObj;
    }

    return {
      tokenMap,
      realMap,
      wordsSeqs: symResult.wordsSeqs,
    };
  }
}
