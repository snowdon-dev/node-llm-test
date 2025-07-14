import { createInterface, Interface } from "readline";
import { join, dirname, resolve } from "path";
import { tmpdir } from "os";
import { createWriteStream, existsSync } from "fs";
import { getRandomWords } from "./randomfile";
import { prepare, print } from "./app";

function checkAnswer(rl: Interface, actualAnswer: string) {
  console.log("\n\n--- Waiting to check answer...\n");
  console.log("Fill in the missing word:");
  rl.question("Your answer: ", (answer) => {
    console.log("\n".repeat(2));
    if (answer.trim().toLowerCase() === actualAnswer.toLowerCase()) {
      console.log("✅ Correct!");
    } else {
      console.log(`❌ Incorrect. The correct word was: "${actualAnswer}"`);
    }
  });
}

function readSeed(rl: Interface, defaultIn = 12345): Promise<number> {
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

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
process.on("exit", () => rl.close());

const args = process.argv.slice(2);

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
      throw new Error("Invalid write target - create the parent directory");
    }
    if (existsSync(tmpPath)) {
      throw Error("File already exists at the given path: " + tmpPath);
    }
    targetFilePath = tmpPath;
  }
}

readSeed(rl).then(async (seed) => {
  const englishWords = await getRandomWords(wordListNum, seed);

  const result = prepare(englishWords, seed);

  const {
    tokenMap,
    partialTokenizedSentence,
    tokenizedSentence,
    correctAnswer,
    expression,

    sentence,
  } = result;

  console.log("\n");

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
        writeStream.write(line + "\n");
      });
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

  print(partialTokenizedSentence, tokenMap, expression, writerFn);

  console.log("\n\n");
  console.log("---- do not copy the following into the LLM\n\n" + msg);
  console.log("The correct answer is:\n" + tokenizedSentence);
  console.log("The real sentence is:\n" + sentence);

  // TODO: await input from an LLM, allow the llm to check its output
  checkAnswer(rl, correctAnswer);
});
