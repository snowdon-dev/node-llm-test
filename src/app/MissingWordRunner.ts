import { IPuzzleResult } from "../domain/interface";
import { IRandom } from "../domain/IRandom";
import { Description } from "../domain/models/Description";
import { MessageTransfomer } from "../domain/services/MessageTransformer";
import { AppConfig } from "./interface";
import { makeResultFactory } from "./ResultFactory";

export default class MissingWordRunner {
  constructor(
    private readonly random: IRandom,
    private readonly config: AppConfig,
    private readonly inputWords: readonly string[],
    private readonly pangrams: readonly string[],
  ) {}

  result() {
    return makeResultFactory(
      this.random,
      this.config,
      this.inputWords,
      this.pangrams,
    ).prepare();
  }

  print(result: IPuzzleResult, output: (...outs: string[]) => void) {
    const description = new Description(this.random);
    const message = new MessageTransfomer(
      this.random,
      this.random.rand,
      description,
      result,
      this.config.level,
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
