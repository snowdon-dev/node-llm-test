import { Bench } from "tinybench";
import { Puzzle } from "../dist/index.js";
import packageData from '../package.json' with { type: "json" };

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
    Puzzle.New(wordsTmp, 1)
  })
  .add("Large list, high level", () => {
    Puzzle.New(wordsTmp, 1, void 0, 5247);
  });

await bench.run();

console.log(packageData.name, packageData.version);
console.table(bench.table());

/*
┌─────────┬──────────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'Empty list, zero level' │ '6786.3 ± 0.51%' │ '6330.0 ± 98.00'  │ '154887 ± 0.05%'       │ '157978 ± 2457'        │ 147357  │
│ 1       │ 'Empty list, high level' │ '115525 ± 0.60%' │ '108518 ± 2161.0' │ '8915 ± 0.24%'         │ '9215 ± 184'           │ 8659    │
│ 2       │ 'Large list, zero level' │ '159681 ± 0.57%' │ '150601 ± 2639.0' │ '6418 ± 0.28%'         │ '6640 ± 116'           │ 6263    │
│ 3       │ 'Large list, high level' │ '438510 ± 0.68%' │ '415310 ± 8143.0' │ '2320 ± 0.44%'         │ '2408 ± 47'            │ 2281    │
└─────────┴──────────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
*/
