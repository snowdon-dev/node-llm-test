#!/usr/bin/env node
import { createInterface, Interface } from "readline";
import { join, dirname, resolve } from "path";
import { tmpdir } from "os";
import { createWriteStream, existsSync } from "fs";
import { program } from "commander";
import inquirer from "inquirer";
import { getRandomWords } from "./randomfile";
import { Puzzle } from "./app";
import { levelMax } from "./levels";

program
  .name("llmtest")
  .description("Generate tests to evaluate the intelligence of large language models.")
  .option("--number <number>", "The number of words in the wordlist", "200")
  .option("--write [filepath]", "Write to a temporary file or the target path")
  .option("--level <integer>", `Features enabled 0=none ${levelMax}=all`, "0")
  .option("--seed <integer>", "A seed to preserve reproducibility")
  .option("--no-print", "Do not print the output for the LLM")
  .option("-i, --interactive", "Run in interactive mode");

program.parse(process.argv);

const options = program.opts();

async function run() {
  let answers = {
    number: parseInt(options.number, 10),
    write: options.write,
    level: parseInt(options.level, 10),
    seed: options.seed ? parseInt(options.seed, 10) : undefined,
    noPrint: options.noPrint,
  };

  if (options.interactive) {
    const questions = [
      {
        type: "input",
        name: "number",
        message: "Enter the number of words in the wordlist:",
        default: answers.number,
        validate: (value: string) => {
          const num = parseInt(value, 10);
          if (Number.isNaN(num)) {
            return "Please enter a valid integer.";
          }
          return true;
        },
        filter: (value: string) => parseInt(value, 10),
      },
      {
        type: "confirm",
        name: "writeToFile",
        message: "Write to a file?",
        default: !!answers.write,
      },
      {
        type: "input",
        name: "write",
        message: "Enter the file path (or leave blank for a temporary file):",
        when: (answers: { writeToFile: boolean; }) => answers.writeToFile,
        default: typeof answers.write === 'string' ? answers.write : "",
      },
      {
        type: "input",
        name: "level",
        message: `Enter the level (0-${levelMax}):`,
        default: answers.level,
        validate: (value: string) => {
          const num = parseInt(value, 10);
          if (Number.isNaN(num) || num < 0 || num > levelMax) {
            return `Please enter an integer between 0 and ${levelMax}.`;
          }
          return true;
        },
        filter: (value: string) => parseInt(value, 10),
      },
      {
        type: "input",
        name: "seed",
        message: "Enter a seed (or leave blank for a random seed):",
        default: answers.seed,
        validate: (value: string) => {
          if (value === "") return true;
          const num = parseInt(value, 10);
          if (Number.isNaN(num) || num < 0 || num > 2 ** 31 - 1) {
            return `Please enter an integer between 0 and ${2 ** 31 - 1}.`;
          }
          return true;
        },
        filter: (value: string) => (value === "" ? undefined : parseInt(value, 10)),
      },
      {
        type: "confirm",
        name: "noPrint",
        message: "Do not print the output for the LLM?",
        default: answers.noPrint,
      },
    ];
    
    const interactiveAnswers = await inquirer.prompt(questions);
    answers = { ...answers, ...interactiveAnswers };
  }

  const { number, write, level, seed, noPrint } = answers;

  let targetFilePath: string | null = null;
  if (write) {
    if (typeof write === "string" && write.length > 0) {
      const tmpPath = resolve(write);
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
    } else {
        const tempDir = tmpdir();
        const fileName = `sd_llmtest_${Date.now()}.txt`;
        targetFilePath = join(tempDir, fileName);
    }
  }

  const seedToUse = seed === undefined ? Math.floor(Math.random() * (2 ** 31 - 1)) : seed;

  const englishWords = await getRandomWords(number, seedToUse);
  const puzzle = Puzzle.New(englishWords, seedToUse, undefined, level);

  let writerFn: (...outs: string[]) => void = console.log;
  let msg = "";
  if (targetFilePath) {
    msg += "Writing the test to the file:\n" + targetFilePath + "\n\n";
    const writeStream = createWriteStream(targetFilePath, {
      flags: "a",
    });
    process.on("exit", () => writeStream.close());
    writerFn = function (...outs: string[]) {
      outs.forEach((line) => {
        writeStream.write(line);
      });
      writeStream.write("\n");
    };
  }

  if (!noPrint) {
    puzzle.print(writerFn);
  }

  if (!targetFilePath) {
    console.log("---------------- \n");
  }

  console.log("---- do not copy the following into the LLM\n" + msg);
  console.log("The correct answer is:\n" + puzzle.result.tokenizedSentence);
  console.log("The real sentence is:\n" + puzzle.result.sentence);
  console.log("level: " + level);
  console.log("wordcount: " + englishWords.length);

  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  process.on("exit", () => rl.close());

  checkAnswer(rl, puzzle);
}

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
      console.log(`The correct token was: "${puzzle.result.correctAnswer}`);
      console.log(`The correct word was: "${answer.possibleReal}`);
      process.exit();
    } else {
      console.log(
        `❌ Incorrect. The correct token was: "${puzzle.result.correctAnswer}"`,
      );
      checkAnswer(rl, puzzle);
    }
  });
}

run();
