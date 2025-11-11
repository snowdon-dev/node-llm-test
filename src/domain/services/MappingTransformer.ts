import { ISymbols } from "../interface";
import { IRandom } from "../IRandom";
import { PuzzleContext } from "../models/PuzzleContext";
import { ContextSource } from "../reader/ContextSource";
import { SymbolManagerOpts } from "../reader/interface";
import { SymbolManager } from "../reader/SymbolManager";

export class MappingTransformer {
  constructor(
    private readonly random: IRandom,
    private readonly opts: SymbolManagerOpts,
  ) {}

  public create(context: PuzzleContext) {
    const source = new ContextSource(context);
    const symbols = SymbolManager.New(this.random, source, this.opts);
    const symResult = symbols.run();

    const tokenMap: Record<string, ISymbols> = Object.create(null);
    const realMap: Record<string, ISymbols> = Object.create(null);

    const { totalSymbols, tokens } = symResult;

    for (let i = 0; i < totalSymbols.length; i++) {
      const symbolObj = totalSymbols[i];
      const tokenObj = tokens[tokens.length - 1 - i];

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
