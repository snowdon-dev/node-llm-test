export interface IRandom {
  rand(num: number): number;
  bool(): boolean;
  randOrder<T>(input: T[]): T[];
}
