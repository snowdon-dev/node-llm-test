import { getRandomWords } from "./randomfile";

getRandomWords(200).then((words) => {
  const res = JSON.stringify(words);
  console.log(res);
});
