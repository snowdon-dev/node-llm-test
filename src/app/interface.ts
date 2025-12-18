import { LevelsType } from "../domain/levels";

export interface AppConfig {
  maxCycleDepth: number;
  level: LevelsType;
  pangrams: readonly string[];
  seed: number | null;
}
