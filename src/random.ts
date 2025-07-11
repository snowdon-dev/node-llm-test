export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const simpleRandom = (len: number) => Math.floor(Math.random() * (i + 1));

export function randomizeRecord(
  record: Record<string, string>,
  rand: (len: number) => number = simpleRandom
): Record<string, string> {
  const entries = Object.entries(record);
  for (let step = 0; step < 2; step++) {
    // Shuffle using Fisher-Yates algorithm
    for (let i = entries.length - 1; i >= 0; i--) {
      const j = rand(i);
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
  }
  // Convert back to a Record
  return Object.fromEntries(entries);
}

