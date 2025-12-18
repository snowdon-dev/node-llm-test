export type RandMaxRangeCallable = (len: number) => number;

export interface IRandom {
  rand: RandMaxRangeCallable;
  bool(): boolean;
  randOrder<T extends unknown[]>(input: T): T;
}
