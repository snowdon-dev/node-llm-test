export interface IRandom {
  rand(num: number): number;
  bool(): boolean;
  randOrder<T extends unknown[]>(input: T): T;
}
