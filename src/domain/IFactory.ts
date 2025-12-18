import { PuzzleContext } from "./models/PuzzleContext";

export interface IFactory<T> {
  create: () => T;
}
