import { Bench } from "tinybench";
import * as PuzzleMod from "../dist/index.js";
const { Puzzle } = PuzzleMod.default;
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
node-llm-test 0.15.5
┌─────────┬──────────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'Empty list, zero level' │ '6432.4 ± 0.83%' │ '5701.0 ± 66.00'  │ '169882 ± 0.07%'       │ '175408 ± 2054'        │ 155463  │
│ 1       │ 'Empty list, high level' │ '142725 ± 0.95%' │ '124967 ± 2102.0' │ '7480 ± 0.40%'         │ '8002 ± 135'           │ 7007    │
│ 2       │ 'Large list, zero level' │ '138102 ± 0.83%' │ '124910 ± 1555.5' │ '7605 ± 0.34%'         │ '8006 ± 100'           │ 7242    │
│ 3       │ 'Large list, high level' │ '611829 ± 1.17%' │ '549334 ± 11523'  │ '1695 ± 0.75%'         │ '1820 ± 39'            │ 1635    │
└─────────┴──────────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
*/
