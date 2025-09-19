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

class FenwickTree {
  private readonly tree: number[];
  constructor(private readonly n: number) {
    this.tree = new Array(n + 1).fill(0);
  }

  update(i: number, delta: number) {
    for (; i <= this.n; i += i & -i) {
      this.tree[i] += delta;
    }
  }

  query(i: number) {
    let sum = 0;
    for (; i > 0; i -= i & -i) {
      sum += this.tree[i];
    }
    return sum;
  }

  findKth(target: number) {
    let idx = 0;
    let bitMask = 1 << Math.floor(Math.log2(this.n));
    for (; bitMask > 0; bitMask >>= 1) {
      let next = idx + bitMask;
      if (next <= this.n && this.tree[next] <= target) {
        target -= this.tree[next];
        idx = next;
      }
    }
    return idx + 1;
  }
}

export function kthPermutation(arr: number[], k: number) {
  const n = arr.length;
  const fact = [1];
  for (let i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;

  k = k % fact[n];

  const fenwick = new FenwickTree(n);
  for (let i = 1; i <= n; i++) fenwick.update(i, 1);

  const result = [];
  const sortedArr = [...arr].sort((a, b) => a - b);

  for (let i = n; i >= 1; i--) {
    const f = fact[i - 1];
    const index = Math.floor(k / f);
    k %= f;

    const pos = fenwick.findKth(index);
    result.push(sortedArr[pos - 1]);
    fenwick.update(pos, -1);
  }

  return result;
}
