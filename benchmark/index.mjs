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
node-llm-test 0.17.0
┌─────────┬──────────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'Empty list, zero level' │ '12143 ± 0.17%'  │ '11498 ± 163.00'  │ '85245 ± 0.02%'        │ '86972 ± 1235'         │ 823544  │
│ 1       │ 'Empty list, high level' │ '154538 ± 0.41%' │ '142875 ± 2370.0' │ '6766 ± 0.09%'         │ '6999 ± 117'           │ 64709   │
│ 2       │ 'Large list, zero level' │ '137935 ± 0.31%' │ '125699 ± 2013.0' │ '7658 ± 0.10%'         │ '7956 ± 128'           │ 72498   │
│ 3       │ 'Large list, high level' │ '630691 ± 0.55%' │ '572126 ± 15059'  │ '1648 ± 0.23%'         │ '1748 ± 47'            │ 15857   │
└─────────┴──────────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
*/
