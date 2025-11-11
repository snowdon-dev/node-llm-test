import { Bench } from "tinybench";
import * as PuzzleMod from "../dist/index.js";
import * as RandomSourceMod from "../dist/infra/random.js";
const { Puzzle } = PuzzleMod.default;
const { RandomSource, mulberry32 } = RandomSourceMod.default;
import packageData from "../package.json" with { type: "json" };

const bench = new Bench({ name: "simple benchmark", time: 10_000 });

const wordsTmp = Array.from({ length: 600 }).map((_, i) => String(i));

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
//.add("large list simple source", () => {
//  const random = RandomSource.SimpleSource();
//  const list = wordsTmp.slice();
//  for (let i = 0; i < 2; i++) {
//    random.randOrder(list);
//  }
//  for (let i = 0; i < list.length; i++) {
//    const words = [];
//    words.push(list[i]);
//    if (i < list.length - 1 && random.bool()) {
//      words.push(list[i + 1]);
//    }
//    const _ = words.join(" ");
//  }
//})
//.add("large list simple source + operator", () => {
//  const random = RandomSource.SimpleSource();
//  const list = wordsTmp.slice();
//  for (let i = 0; i < 2; i++) {
//    random.randOrder(list);
//  }
//  for (let i = 0; i < list.length; i++) {
//    let tmp = list[i];
//    if (i < list.length - 1 && random.bool()) {
//      tmp += " " + list[i+1];
//    }
//  }
//})
//.add("large list simple source for + operator", () => {
//  const random = RandomSource.SimpleSource();
//  const list = wordsTmp.slice();
//  for (let i = 0; i < 2; i++) {
//    random.randOrder(list);
//  }
//  for (let i = 0; i < list.length; i++) {
//    const words = [];
//    words.push(list[i])
//    if (i < list.length - 1 && random.bool()) {
//      words.push(list[i+1]);
//    }
//    let tmp = '';
//    for (let i = 0; i < words.length; i++) {
//      tmp += words[i];
//      if (i < words.length - 1) tmp += ' ';
//    }
//  }
//})
//// for comparison
//.add("Large list mulberry", () => {
//  const random = new RandomSource(mulberry32(1));
//  const list = wordsTmp.slice();
//  for (let i = 0; i < 2; i++) {
//    random.randOrder(list);
//  }
//  for (let i = 0; i < list.length; i++) {
//    const words = [];
//    words.push(list[i]);
//    if (i < list.length - 1 && random.bool()) {
//      words.push(list[i + 1]);
//    }
//    const _ = words.join(" ");
//  }
//})
//.add("Large list random", () => {
//  const random = new RandomSource(Math.random);
//  const list = wordsTmp.slice();
//  for (let i = 0; i < 2; i++) {
//    random.randOrder(list);
//  }
//  for (let i = 0; i < list.length; i++) {
//    const words = [];
//    words.push(list[i]);
//    if (i < list.length - 1 && random.bool()) {
//      words.push(list[i + 1]);
//    }
//    const _ = words.join(" ");
//  }
//})
//.add("Large list crypto random", () => {
//  const random = RandomSource.New(RandomSource.TYPES.smallcrypto, null);
//  const list = wordsTmp.slice();
//  for (let i = 0; i < 2; i++) {
//    random.randOrder(list);
//  }
//  for (let i = 0; i < list.length; i++) {
//    const words = [];
//    words.push(list[i]);
//    if (i < list.length - 1 && random.bool()) {
//      words.push(list[i + 1]);
//    }
//    const _ = words.join(" ");
//  }
//});

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
