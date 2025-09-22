import { Bench } from "tinybench";
import { Puzzle } from "../dist/index.js";
import packageData from "../package.json" with { type: "json" };

const bench = new Bench({ name: "simple benchmark", time: 1000 });

const wordsTmp = Array.from({ length: 600 }).map((_, i) => String(i));

bench
  .add("Empty list, zero level", () => {
    Puzzle.New([], 1);
  })
  .add("Empty list, high level", () => {
    Puzzle.New([], 1, void 0, 5247);
  })
  .add("Large list, zero level", () => {
    Puzzle.New(wordsTmp, 1);
  })
  .add("Large list, high level", () => {
    Puzzle.New(wordsTmp, 1, void 0, 5247);
  });

await bench.run();

console.log(packageData.name, packageData.version);
console.table(bench.table());

/*
node-llm-test 0.15.0
┌─────────┬──────────────────────────┬──────────────────┬───────────────────┬─────────────
───────────┬────────────────────────┬─────────┐
│ (index) │ Task name                │ Latency avg (ns) │ Latency med (ns)  │ Throughput a
vg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────┼──────────────────┼───────────────────┼─────────────
───────────┼────────────────────────┼─────────┤
│ 0       │ 'Empty list, zero level' │ '7294.6 ± 1.07%' │ '5654.0 ± 83.00'  │ '166624 ± 0.
10%'       │ '176866 ± 2603'        │ 137088  │
│ 1       │ 'Empty list, high level' │ '172187 ± 1.37%' │ '138444 ± 5238.5' │ '6457 ± 0.59
%'         │ '7223 ± 281'           │ 5808    │
│ 2       │ 'Large list, zero level' │ '137031 ± 1.06%' │ '112098 ± 2473.0' │ '7993 ± 0.50
%'         │ '8921 ± 200'           │ 7298    │
│ 3       │ 'Large list, high level' │ '614432 ± 1.69%' │ '527321 ± 43931'  │ '1749 ± 1.04
%'         │ '1896 ± 170'           │ 1628    │
└─────────┴──────────────────────────┴──────────────────┴───────────────────┴─────────────
───────────┴────────────────────────┴─────────┘
*/
