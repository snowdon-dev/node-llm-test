import { createInterface, Interface } from "readline";
import { join, dirname, resolve } from "path";
import { tmpdir } from "os";
import { createWriteStream, existsSync } from "fs";
import { getRandomWords } from "./randomfile";
import { Puzzle } from "./app";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
process.on("exit", () => rl.close());

const args = process.argv.slice(2);

const noPrint = args.indexOf("--no-print") !== -1;

const idx = args.indexOf("--number");
let wordListNum = 200;
if (!(idx === -1 || !args[idx + 1])) {
  const num = parseInt(args[idx + 1], 10);
  wordListNum = num;
  if (Number.isNaN(num)) {
    console.error("Error: --number must be a valid integer");
    process.exit(1);
  }
}

const writeIdx = args.indexOf("--write");
let write = writeIdx !== -1;
let targetFilePath: string | null = null;
if (write) {
  if (args[writeIdx + 1]) {
    const tmpPath = resolve(args[writeIdx + 1]);
    const parentDir = dirname(tmpPath);
    const hasParent = existsSync(parentDir);
    if (!hasParent) {
      console.error("Invalid write target - create the parent directory");
      process.exit(1);
    }
    if (existsSync(tmpPath)) {
      console.error("File already exists at the given path: " + tmpPath);
      process.exit(1);
    }
    targetFilePath = tmpPath;
  }
}

const levelIdx = args.indexOf("--level");
const levelSize = 15;
let levelIn = 0;
if (!(levelIdx === -1 || !args[levelIdx + 1])) {
  const levelTmp = parseInt(args[levelIdx + 1]);
  if (isNaN(levelTmp) || levelTmp > levelSize) {
    console.error(
      `Error: --level must be a valid integer between 0-${levelSize} - given ` +
        args[levelIdx + 1],
    );
    process.exit(1);
  }

  levelIn = levelTmp;
}
// TODO: add presets for hight min and low

let seedIdx = args.indexOf("--seed");
let seedIn: number | null = null;
if (!(seedIdx === -1 || !args[seedIdx + 1])) {
  const seedTmp = parseInt(args[seedIdx + 1]);
  if (isNaN(seedTmp) || seedTmp < 0 || seedTmp > 2 ** 31 - 1) {
    console.error(
      "Error: --seed number be between 0 and " +
        (2 ** 31 - 1) +
        " given: " +
        args[seedIdx + 1],
    );
    process.exit();
  }
  seedIn = seedTmp;
}
// TODO: add random seed option

function checkAnswer(rl: Interface, puzzle: Puzzle) {
  console.log("\n\n--- Waiting to check answer...\n");
  console.log("Enter the missing symbolised words(s):");
  rl.question("Your answer: ", (answerIn) => {
    console.log("\n");
    const answer = puzzle.answer(answerIn.trim());
    if (answer.exact) {
      console.log("✅ Correct!");
      process.exit();
    } else if (answer.possible) {
      console.log(
        "The answer completes the alphabet, but was not the expected result.",
      );
      console.log("It may be correct if it works in the original sentence");
      console.log(`The correct word was: "${puzzle.result.correctAnswer}`);
      process.exit();
    } else {
      console.log(
        `❌ Incorrect. The correct word was: "${puzzle.result.correctAnswer}"`,
      );
      checkAnswer(rl, puzzle);
    }
  });
}

function readSeed(rl: Interface, defaultIn = 12345): Promise<number> {
  if (seedIn !== null) {
    return Promise.resolve(seedIn);
  }
  return new Promise((res) => {
    console.log(
      "\nEnter a seed, in the type of number. I.e 12345, the default.\nOr enter blank (Enter) to use the default.",
    );
    let seed: number | null = null;
    rl.question("Enter seed: ", (seedIn) => {
      seedIn.trim();
      if (!/\d+/.test(seedIn)) {
        console.log("using default: " + defaultIn);
        return res(defaultIn);
      }
      seed = Number(seedIn);
      console.log("Using the seed: " + seed);

      if (!seed) {
        throw new Error("Invalid seed entered = try again");
      }
      res(seed);
    });
  });
}

readSeed(rl).then(async (seed) => {
  function setupFileWriter() {
    const tempDir = tmpdir();
    const fileName = `sd_llmtest_${Date.now()}.txt`;
    const tempFilePath = join(tempDir, fileName);
    return tempFilePath;
  }
  const fileWriter = (tempFilePath: string) => {
    const writeStream = createWriteStream(tempFilePath, {
      flags: "a",
    });
    process.on("exit", () => writeStream.close());
    return function (...outs: string[]) {
      outs.forEach((line) => {
        writeStream.write(line);
      });
      writeStream.write("\n");
    };
  };

  let writerFn: (...outs: string[]) => void;
  let msg = "";
  if (write) {
    const path = targetFilePath === null ? setupFileWriter() : targetFilePath;
    msg += "Writing the test to the file:\n" + path + "\n\n";
    writerFn = fileWriter(path);
  } else {
    writerFn = console.log;
  }

  if (!write) {
    console.log("---------------- \n");
  }

  const englishWords = await getRandomWords(wordListNum, seed);

  const puzzle = Puzzle.New(englishWords, seed, undefined, levelIn);

  !noPrint && puzzle.print(writerFn);
  !write && console.log("\n");
  console.log("---- do not copy the following into the LLM\n" + msg);
  console.log("The correct answer is:\n" + puzzle.result.tokenizedSentence);
  console.log("The real sentence is:\n" + puzzle.result.sentence);
  console.log("level: " + levelIn);
  console.log("wordcount: " + englishWords.length);

  // TODO: await input from an LLM, allow the llm to check its output
  checkAnswer(rl, puzzle);
});
