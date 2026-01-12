import { LevelsType } from "../domain/levels";

export interface IAppConfig {
  maxCycleDepth: number;
  level: LevelsType;
  pangrams: readonly string[];
  seed: number | null;
}

export type AppConfig = Readonly<IAppConfig>;
