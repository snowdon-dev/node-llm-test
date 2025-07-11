import { createInterface, Interface } from "readline";
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
      console.log(`❌ Incorrect. The correct word was: "${answer}"`);
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
        seed = defaultIn;
        return res(seed);
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
const idx = args.indexOf('--number');

let wordListNum = 200;
if (!(idx === -1 || !args[idx+1])) {
  const num = parseInt(args[idx+1], 10);
  wordListNum = num;
  if (Number.isNaN(num)) {
    console.error('Error: --number must be a valid integer');
    process.exit(1);
  }
}



readSeed(rl).then(async (seed) => {
  const englishWords = await getRandomWords(wordListNum);

  const result = prepare(englishWords, seed);

  const {
    tokenMap,
    partialTokenizedSentence,
    tokenizedSentence,
    correctAnswer,
    expression,

    sentence
  } = result;

  console.log("\n");

  print(partialTokenizedSentence, tokenMap, expression, (...outs: string[]) => {
    outs.forEach((str) => console.log(str));
  });

  console.log("\n\n");
  console.log("---- do not copy the following into the LLM");
  console.log("The correct answer is:\n" + tokenizedSentence);
  console.log("The real sentence is:\n" + sentence);

  checkAnswer(rl, correctAnswer);
});
