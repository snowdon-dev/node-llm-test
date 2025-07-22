import { getRandomWords } from "./randomfile";

const args = process.argv.slice(2);
const idx = args.indexOf("--number");

if (idx === -1 || !args[idx + 1]) {
  console.error("Usage: node index.js --number <value>");
  process.exit(1);
}

const num = parseInt(args[idx + 1], 10);
if (Number.isNaN(num)) {
  console.error("Error: --number must be a valid integer");
  process.exit(1);
}

getRandomWords(num).then((words) => {
  const res = JSON.stringify(words);
  console.log(res);
});
