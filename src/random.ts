export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const simpleRandom = (len: number) =>
  Math.floor(Math.random() * (len + 1));

export function randomizeRecord(
  record: Record<string, string>,
  rand: (len: number) => number = simpleRandom,
  stepsIn = 1,
): Record<string, string> {
  const entries = getRandomOrder(Object.entries(record), rand, stepsIn);
  return Object.fromEntries(entries);
}

// Shuffle using Fisher-Yates algorithm
export function getRandomOrder<T extends unknown[]>(
  shuffled: T,
  rand: (len: number) => number,
  steps = 1,
) {
  for (let k = 0; k < steps; k++) {
    for (let i = shuffled.length - 1; i >= 1; i--) {
      const j = rand(i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  return shuffled;
}

export function pickRandomBucket<T>(
  arrays: T[][],
  totalLength: number,
  rand: (num: number) => number,
): [number, T[]] {
  let randIndex = rand(totalLength - 1);
  for (const arr of arrays) {
    if (randIndex < arr.length) {
      return [randIndex, arr];
    }
    randIndex -= arr.length;
  }

  throw new Error("Should never reach here");
}
