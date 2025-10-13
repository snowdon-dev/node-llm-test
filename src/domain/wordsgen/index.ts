export class WordSelector {
  constructor(private readonly rand: () => number) {}

  select(words: string[], count: number): string[] {
    const selected: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(this.rand() * words.length);
      selected.push(words[randomIndex]);
    }
    return selected;
  }
}

export function parseValidWords(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && line.length < 8)
    .map((line) => line);
}

export interface DictionaryRepository {
  getAllWords(): Promise<string[]>;
}
