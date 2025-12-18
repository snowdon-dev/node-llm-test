import { IRandom } from "../domain/IRandom";

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

function cryptoRandom() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0xffffffff;
}

type RandomType = keyof typeof RandomSource.TYPES;

export class RandomSource implements IRandom {
  static readonly TYPES = {
    small: "small",
    none: "none",
    smallcrypto: "smallcrypto",
  } as const;

  private static createHandler(
    type: RandomType,
  ): (seed: unknown) => () => number {
    switch (type) {
      case RandomSource.TYPES.small:
        return mulberry32;
      case RandomSource.TYPES.smallcrypto:
        return (_) => cryptoRandom;
      case RandomSource.TYPES.none:
        return (_) => Math.random;
      default:
        throw new Error();
    }
  }

  static New(
    type: RandomType = RandomSource.TYPES.small,
    seed?: number | null,
  ) {
    const randH = RandomSource.createHandler(type)(seed);
    const rand = (len: number) => Math.floor(randH() * (len + 1));
    return new RandomSource(randH, rand);
  }

  static SimpleSource = (start: number = 0) => new SimpleSourceImpl(start);

  constructor(
    public readonly randH: () => number,
    public readonly rand: (len: number) => number,
  ) {}

  bool = () => Boolean(this.rand(1));

  randOrder<T extends unknown[]>(input: T) {
    for (let i = input.length - 1; i >= 1; i--) {
      const j = this.rand(i);
      [input[i], input[j]] = [input[j], input[i]];
    }
    return input;
  }
}

class SimpleSourceImpl extends RandomSource {
  constructor(private counter: number) {
    super(
      () => this.counter++,
      (num) => this.counter++ % num,
    );
  }
}
