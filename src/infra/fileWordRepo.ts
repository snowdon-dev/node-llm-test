import { createReadStream, realpathSync } from "node:fs";
import { createInterface } from "node:readline";
import { DictionaryRepository } from "../domain/wordsgen";
import { parseValidWords } from "../domain/wordsgen";

const DICT_PATHS = ["/usr/share/dict/words", "/usr/dict/words"];

export class FileDictionaryRepository implements DictionaryRepository {
  async getAllWords(): Promise<string[]> {
    for (const path of DICT_PATHS) {
      try {
        const realPath = realpathSync(path);
        const lines = await this.readAllLines(realPath);
        return parseValidWords(lines);
      } catch {
        continue;
      }
    }
    throw new Error("No dictionary found on system");
  }

  private async readAllLines(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      const stream = createReadStream(path);
      const rl = createInterface({ input: stream, crlfDelay: Infinity });

      rl.on("line", (line) => lines.push(line));
      rl.on("close", () => resolve(lines));
      rl.on("error", reject);
      stream.on("error", reject);
    });
  }
}
