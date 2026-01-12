import { LevelsType } from "./levels";

export interface IConfig {
  readonly maxCycleDepth: number;
  readonly level: Readonly<LevelsType>;
}
