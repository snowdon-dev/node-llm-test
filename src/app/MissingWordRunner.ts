import { IPuzzleResult } from "../domain/interface";
import { IRandom } from "../domain/IRandom";
import { LevelsType } from "../domain/levels";
import { Description } from "../domain/models/Description";
import { MessageTransfomer } from "../domain/services/MessageTransformer";
import { simpleRandom } from "../infra/random";
import { makeResultFactory } from "./ResultFactory";

export default class MissingWordRunner {
  constructor(
    private readonly random: IRandom,
    private readonly level: LevelsType,
    private readonly inputWords: readonly string[],
    private readonly pangrams: readonly string[],
  ) {}

  result() {
    return makeResultFactory(
      this.random,
      this.level,
      this.inputWords,
      this.pangrams,
    ).prepare();
  }

  print(result: IPuzzleResult, output: (...outs: string[]) => void) {
    const description = new Description(this.random);
    const message = new MessageTransfomer(
      this.random,
      simpleRandom,
      description,
      result,
      this.level,
    );

    const parts = message.transfom();
    parts.forEach((fn, i) => {
      output(fn());
      if (i < parts.length - 1) {
        output("");
      }
    });
  }
}
