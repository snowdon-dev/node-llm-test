import { Bench } from "tinybench";
import * as PuzzleMod from "../dist/index.js";
const { Puzzle } = PuzzleMod.default;
import packageData from "../package.json" with { type: "json" };

const bench = new Bench({ name: "simple benchmark", time: 10_000 });

const wordsTmp = Array.from({ length: 600 }).map((_, i) => String(i));

// warm cache
void Puzzle.New(1, 5247, wordsTmp).result();

bench
  .add("Empty list, zero level", () => {
    Puzzle.New(1, void 0, []).result();
  })
  .add("Empty list, high level", () => {
    Puzzle.New(1, 5247, []).result();
  })
  .add("Large list, zero level", () => {
    Puzzle.New(1, void 0, wordsTmp).result();
  })
  .add("Large list, high level", () => {
    Puzzle.New(1, 5247, wordsTmp).result();
  });

await bench.run();

console.log(packageData.name, packageData.version);
console.table(bench.table());

/*
 node-llm-test 0.16.1
 ┌─────────┬──────────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'Empty list, zero level' │ '7351.3 ± 0.90%' │ '6629.0 ± 112.00' │ '147373 ± 0.02%'       │ '150852 ± 2569'        │ 1360310 │
│ 1       │ 'Empty list, high level' │ '145069 ± 0.74%' │ '130268 ± 2557.0' │ '7310 ± 0.11%'         │ '7676 ± 150'           │ 68933   │
│ 2       │ 'Large list, zero level' │ '115972 ± 0.92%' │ '104266 ± 2042.0' │ '9164 ± 0.10%'         │ '9591 ± 188'           │ 86228   │
│ 3       │ 'Large list, high level' │ '605224 ± 0.86%' │ '544375 ± 14537'  │ '1730 ± 0.24%'         │ '1837 ± 50'            │ 16524   │
└─────────┴──────────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
*/
