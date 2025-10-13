export function permute<T>(arr: readonly T[]): T[][] {
  return arr.length === 0
    ? [[]]
    : arr.flatMap((x, i) =>
        permute([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [
          x,
          ...p,
        ]),
      );
}
