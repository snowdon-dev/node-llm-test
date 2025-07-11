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

readSeed(rl).then(async (seed) => {
  const englishWords = await getRandomWords(200);
  const {
    tokenMap,
    partialTokenizedSentence,
    tokenizedSentence,
    tokenizedWords,
    expression,
  } = prepare(englishWords, seed);

  print(
    partialTokenizedSentence,
    tokenMap,
    expression,
    (...outs: string[]) => {
      outs.forEach((str) => console.log(str));
    },
  );

  console.log("\n\n");
  console.log("---- do not copy the following into the LLM");
  console.log("The correct answer is:\n" + tokenizedSentence);

  checkAnswer(rl, tokenizedWords[tokenizedWords.length - 1]);
});
