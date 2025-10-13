import { pangramsDefault } from "../domain/characters";
import { module_version } from "../config";
import { ILLMTest, IPuzzleResult } from "../domain/interface";
import MissingWordRunner from "../app/MissingWordRunner";
import { createApp } from "./create";

function asciiTable(headers: string[], rows: string[][]) {
  const colWidths = headers.map((h, i) => {
    return Math.max(h.length, ...rows.map((r) => String(r[i]).length));
  });

  const formatRow = (row: string[]) =>
    "| " +
    row.map((cell, i) => String(cell).padEnd(colWidths[i], " ")).join(" | ") +
    " |";

  const separator =
    "+-" + colWidths.map((w) => "-".repeat(w)).join("-+-") + "-+";

  let output = separator + "\n";
  output += formatRow(headers) + "\n";
  output += separator + "\n";
  rows.forEach((r) => {
    output += formatRow(r) + "\n";
  });
  output += separator;

  return output;
}

export class Puzzle implements ILLMTest {
  /**
   * @param inputWords A list of words to be appended into a word list of the
   * language.
   * @param seed A unique seed to preserve determinism or null to use Math.random.
   * @param panagrams A list of pangrams to select from.
   * @param level The hardness of the game.
   */
  static New = (
    seed: number | null = 12345,
    level: number = 0,
    inputWords: readonly string[] = [],
    pangrams: readonly string[] = pangramsDefault,
  ) => new Puzzle(createApp(level, seed, inputWords, pangrams));

  public static readonly VERSION = module_version;

  constructor(private readonly game: MissingWordRunner) {}

  public result(): IPuzzleResult {
    return this.game.result();
  }

  public print(result: IPuzzleResult, output: (...outs: string[]) => unknown) {
    this.game.print(result, output);
  }

  public answer(result: IPuzzleResult, strIn: string) {
    return result.answer(strIn);
  }

  public printWork(result: IPuzzleResult) {
    const { headers, rows } = result.wordTable();
    return asciiTable(headers, rows);
  }
}
