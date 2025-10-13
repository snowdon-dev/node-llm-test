import { WordSelector } from "../domain/wordsgen";
import { FileDictionaryRepository } from "../infra/fileWordRepo";
import { mulberry32 } from "../infra/random";

export async function getRandomWords(
  count = 10,
  seed = 12345,
): Promise<string[]> {
  const repo = new FileDictionaryRepository();
  const words = await repo.getAllWords();

  const rand = mulberry32(seed);
  const selector = new WordSelector(rand);
  return selector.select(words, count);
}

export function getRandomSelection(
  input: string[],
  count = 10,
  seed = 12345,
): string[] {
  const rand = mulberry32(seed);
  const selector = new WordSelector(rand);
  return selector.select(input, count);
}
