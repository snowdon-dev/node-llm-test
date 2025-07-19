import { createReadStream, realpathSync } from "node:fs";
import { createInterface } from "node:readline";
import { mulberry32 } from "./random";

const DICT_PATHS = ["/usr/share/dict/words", "/usr/dict/words"];

export async function getRandomWords(
  count: number = 10,
  seed = 12345,
): Promise<string[]> {
  for (const path of DICT_PATHS) {
    try {
      const rp = realpathSync(path);
      const words = await readAllWords(rp);
      return getRandomSelection(words, count, seed);
    } catch (error) {
      continue;
    }
  }
  throw new Error("No dictionary found on system");
}

async function readAllWords(path: string): Promise<string[]> {
  const words: string[] = [];
  const p = new Promise<string[]>((resolve, reject) => {
    const fileStream = createReadStream(path);

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    rl.on("line", (line) => {
      const word = line.trim();
      // TODO: uppercase case word - lowercase this maybe
      if (word.length < 8 && word.length > 2) {
        words.push(word);
      }
    });

    rl.on("close", () => {
      resolve(words);
    });

    const rej = () => {
      reject();
    };

    rl.on("error", rej);
    fileStream.on("error", rej);
  });
  await p;
  return words;
}

function getRandomSelection(
  words: string[],
  count: number,
  seed: number,
): string[] {
  const rand = mulberry32(seed);
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(rand() * words.length);
    selected.push(words[randomIndex]);
  }
  return selected;
}
