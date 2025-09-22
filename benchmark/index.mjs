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
┌─────────┬──────────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'Empty list, zero level' │ '6284.7 ± 0.52%' │ '5633.0 ± 61.00'  │ '172322 ± 0.06%'       │ '177525 ± 1933'        │ 159118  │
│ 1       │ 'Empty list, high level' │ '154646 ± 1.19%' │ '138528 ± 4653.0' │ '6773 ± 0.37%'         │ '7219 ± 247'           │ 6467    │
│ 2       │ 'Large list, zero level' │ '129035 ± 0.75%' │ '113630 ± 3319.0' │ '8156 ± 0.37%'         │ '8800 ± 262'           │ 7750    │
│ 3       │ 'Large list, high level' │ '566090 ± 1.21%' │ '509869 ± 30193'  │ '1840 ± 0.77%'         │ '1961 ± 122'           │ 1767    │
└─────────┴──────────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
*/
