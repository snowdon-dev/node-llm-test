# node-llm-test

![Build Status](https://github.com/snowdon-dev/node-llm-test/actions/workflows/main-push.yaml/badge.svg)
![Coverage Status](https://snowdon-dev.github.io/node-llm-test/badges/badges.svg)
[![Npm version](https://img.shields.io/npm/v/node-llm-test.svg)](https://www.npmjs.com/package/node-llm-test)
[![Download NPM](https://img.shields.io/npm/dm/node-llm-test.svg?style=flat)](https://www.npmjs.com/package/node-llm-test/)

Please let me know if you encounter any issues.

It’s worth noting that most of the mechanics operate on a 50% chance of
activation. This means that even at the highest level, there is a real
possibility that the test output will be simple—some tests remain trivial to
solve regardless of difficulty. To obtain meaningful results, a large number of
tests must be run, as the majority are expected to fail. For example, when the
mapping order is left-to-right rather than right-to-left, the LLM tends to
produce more correct answers.

- See the web app at: <https://marketeer.snowdon.dev/tools/llmtest-online/>.
- Don't want to keep running tests. Sign up to the periodic newsletter
containing results from the leading agents. And stay informed without spinning up
infra. Just email: <llmtest@snowdon.dev>.

Commercial use of this code package requires permission—please contact me at
<hello@snowdon.dev> if you intend to use it for such purposes. The web app,
however, is freely available for you to explore at your convenience.
To learn more from the Oxford AI Chair (not me)
<https://www.youtube.com/watch?v=7-UzV9AZKeU>.

<!--toc:start-->
- [node-llm-test](#node-llm-test)
  - [The puzzle](#the-puzzle)
  - [Notes about the implementation](#notes-about-the-implementation)
  - [Why was this created](#why-was-this-created)
  - [Usage](#usage)
  - [Install](#install)
  - [Programmatic Usage](#programmatic-usage)
  - [CLI usage](#cli-usage)
  - [Test Levels. Worked example](#test-levels-worked-example)
    - [Level 1](#level-1)
    - [Level 14](#level-14)
<!--toc:end-->

## The puzzle

LLMs cannot solve this puzzle effectively because they rely on statistical
patterns, which this test disrupts by introducing a constructed language with
minimal statistical grounding. If an LLM could truly reason, the task would be
trivial. While identifying the missing word is difficult for a human, especially
someone like me who doesn’t typically engage with grammatical puzzles, it
should, in theory, be simple for an LLM.

For example, given the sequence “the quick brown `[..]`”, an LLM will almost
always guess the correct next word based purely on probability. However, to
pass this test, the LLM must go beyond prediction. It must first reason through
the encoded sentence, translate it into natural English, complete the sentence,
and then convert it back to the encoded form to select the correct missing
word.

## Notes about the implementation

I’ve also introduced randomness into the puzzle generation process. This
ensures that even if an LLM has access to solved examples, any newly generated
test will differ significantly in its wording and structure, making
memorization ineffective.

Importantly, while each test is deterministic given a fixed wordlist, seed,
level, and code version—meaning the same inputs will always produce the same
encoded and decoded sentences—this determinism can break if the code version
changes or the underlying wordlist is updated. To preserve reproducibility, I
can provide options for using a static wordlist and locking the process to a
specific code tag. Let me know if you'd like support for that.

## Why was this created

I noticed that all AIs seem to fail using the tools that I use. I wondered if
it was because of the lack of public information to train them on. This test
proves it.

## Usage

- [Create a Codespace](https://docs.github.com/en/codespaces/developing-in-a-codespace/opening-an-existing-codespace)
Then simply, run the command `llmtest` in the terminal.

## Install

`npm install node-llm-test`

## Programmatic Usage

```javascript
import { Puzzle } from "node-llm-test";
import { getRandomWords } from "node-llm-test/randomfile";

const seed = Math.floor(Math.random() * (2 ** 31 - 1));
const wordList = await getRandomWords(600, seed);
const puzzle = Puzzle.New(
  [
    /*someWordList*/
  ],
  seed,
);
//const puzzle2 = Puzzle.New();

puzzle.print(console.log);
```

## CLI usage

To run the CLI:

`npx llmtest`

For example:

`npx llmtest --number 0 --write`

`npx llmtest --number 0 --write ~/Documents/test1`

Or run in interactive mode:

`npx llmtest --interactive`

| Argument                     | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `--number <number>`          | The number of words in the wordlist (default: 200) |
| `--write [filepath]`         | Write to a temporary file or the target path       |
| `--level <integer>`          | Features enabled (0=none, 63=all, default: 0)      |
| `--seed <integer>`           | A seed to preserve reproducibility                 |
| `--no-print`                 | Do not print the output for the LLM                |
| `-i, --interactive`          | Run in interactive mode                            |
| `--wordlist-file <filepath>` | Load wordlist from a file                          |
| `--answer <string>`          | Provide answer via arguments, implies --no-answer  |
| `--no-answer`                | Do not wait for an answer on stdin                 |

---

## Test Levels. Worked example

I recommend trying the game out at a low level and word count, at least
once. Some information is omitted here. See web app link at the top of file.

Given commands may not be reproducible unless, you happen to be one the same
version.

```
npx llmtest -- --number 0 --count 0 --seed 1234
```

### Level 1

```console
# zero extra words, zero extra reasoning steps
npx llmtest --number 0 --level 0
```

```txt
...
Table of mappings:
'vex' 'waltz' {}
'quick' 'fjords' {}
'fjords' 'Big' {}
'Big' 'nymph' {}
'waltz' 'vex' {}
'nymph' 'quick' {}
...

Symbolised sentence with missing word:
fjords quick waltz nymph vex [...]
```

ChatGPT says:

```txt
Missing word (symbolised form): Big
Input sentence (symbolised form): fjords quick waltz nymph vex Big
```

FYI:

```txt
The correct answer is:
fjords quick waltz nymph vex Big
The real sentence is:
Big fjords vex quick waltz nymph
```

This test has a straightforward probabilistic solution, and the LLM
successfully arrives at the correct result without chain of thought. Given the
sentence, the missing word is the one not present in the sequence. From the
lookup table, we observe that the word “**Big**” has two mappings: `'Big' →
'nymph'` and `'fjords' → 'Big'`. Which would make either a likely candidate for
the missing word, if additional words from the domain were present.

At this level, the order of the expression is explicitly provided in the
instructions. This makes it a very easy Level 0 test. The task can become
identifying the one word from the domain that is not present in the sentence.

In this case, the word “Big” stands out as is not included in the sentence.
This structure allows for a simple elimination approach to deduce the missing
word.

It’s important to note that, despite the simplicity of the structure, some
reasoning is still required to arrive at the correct answer due to the way the
test is presented. So the solver must infer the ordering and relationships from
the text. This subtle requirement distinguishes it from a purely mechanical
task and introduces a minimal layer of logical deduction.

### Level 14

```console
npx llmtest -- --number 0 --level 14 --seed 123

The following describes a puzzle. To complete the game you must figure out the
missing word without asking any questions.

The operator '>>>' defines a mapping between two character sequences enclosed
within ''. Each mapping in the table is separated by a newline (\n) character.
You will be given a sentence that has a missing word and has been encoded into
a symbolised form.



🗺️ Table of mappings:
>>> 'low bid' 'low bid etchings'
>>> 'for zinc' 'examining bid'
>>> 'every' 'every bid'
>>> 'etchings' 'Just bid'
>>> 'quoted' 'keep Just'
>>> 'Just keep' 'quoted zinc'
>>> 'examining' 'for Just'


Take into account the given symbolised sentence and
other contextual information. Complete the following tasks:

- Find the missing word in the sentence.
- Print your answer as concisely as possible.
- Provide your answer for the missing word.
- Show the input sentence in symbolised form.
- Do not provide the answer in english.
- Provide the answer in the symbolised form.


Symbolised sentence with missing word:
quoted zinc for Just every bid low bid etchings keep Just examining bid [...]


---- do not copy the following into the LLM

The correct answer is:
quoted zinc for Just every bid low bid etchings keep Just examining bid Just bid
The real sentence is:
Just keep examining every low bid quoted for zinc etchings


--- Waiting to check answer...

Fill in the missing word:
Your answer: etchings


❌ Incorrect. The correct word was: "Just bid"
```

