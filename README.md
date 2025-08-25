# node-llm-test

![Build
Status](https://github.com/snowdon-dev/node-llm-test/actions/workflows/main-push.yaml/badge.svg)
![Coverage Status](https://snowdon-dev.github.io/node-llm-test/badges/badges.svg)
[![Npm version](https://img.shields.io/npm/v/node-llm-test.svg)](https://www.npmjs.com/package/node-llm-test)
[![Download NPM](https://img.shields.io/npm/dm/node-llm-test.svg?style=flat)](https://www.npmjs.com/package/node-llm-test/)

A puzzle test to evaluate the intelligence of large language models. A
linear-time algorithm for generating infinitely many test instances.

Using the most token-efficient method and the simplest token format, the test
presents an easy logical puzzle, using a domain and steps that are native and
natural to a computer agent. The puzzle may involve few or many steps and may
permit simple tool calls. The solution requires reasoning rather than
computation, and the design eliminates reliance on memorization to ensure that
the test cannot be solved by prior training.
Please let me know if you encounter any issues.

- See the web app at: <https://marketeer.snowdon.dev/tools/llmtest-online/>.
- Don't want to keep running tests. Sign up to the periodic newsletter
containing results from the leading agents. And stay informed without spinning
up infra. Just email: <llmtest@snowdon.dev>.

Commercial use of this code package requires permission—please contact me at
<hello@snowdon.dev> if you intend to use it for such purposes. The web app,
however, is freely available at your convenience. To learn more from the Oxford
AI Chair (not me) <https://www.youtube.com/watch?v=7-UzV9AZKeU>.

<!--toc:start-->
- [node-llm-test](#node-llm-test)
  - [The puzzle](#the-puzzle)
  - [Implementation notes](#implementation-notes)
  - [Why was this created](#why-was-this-created)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Programmatic Usage](#programmatic-usage)
    - [CLI usage](#cli-usage)
  - [Test Levels. Worked example](#test-levels-worked-example)
    - [Reference](#reference)
    - [Extra notes & usage tips](#extra-notes-usage-tips)
    - [Level 0](#level-0)
    - [Level 14](#level-14)
<!--toc:end-->

## The puzzle

The quick brown fox lookup test. A test that is solved by the simple act of
looking things up.

LLMs cannot solve this simple puzzle effectively because they rely on
statistical patterns, which this test disrupts by introducing a constructed
language with minimal statistical grounding. If an LLM could truly reason, the
task would be trivial. While identifying the missing word is difficult for a
human, especially someone like me who doesn’t typically engage with grammatical
puzzles, it should, in theory, be simple for an LLM. For it does know what a
pangram is and all the variations or pangrams, and there is many resources that
can be looked up.

For example, given the sequence “the quick brown `[..]`”, an LLM will almost
always guess the correct next word based purely on probability. However, to
pass this test, the LLM must go beyond prediction. It must first reason through
the encoded sentence, translate it into natural English, complete the sentence,
and then convert it back to the encoded form to select the correct missing
word.

The test also reduces to a simple deterministic answer that is very easy to
compute and check. Unlike other puzzles that rely on probabilistic outcomes,
external datasets, or auxiliary GPT/LLM models, results here are unambiguous:
answers are either correct or wrong. And answers may never have been correct
before. However, there exists a possibility that the model can provide an
answer that was unexpected but completes a pangram, it may find a novel
solution. To ensure that novel solutions exist, if you want them, you must
designed the input to the puzzle carefully to include them.

Simple puzzles (with few features/levels) may measure the number of tokens
output, or the time taken to complete a correct test. While complicated puzzles
may test the total reasoning capability. This test forces the model to think,
which seems to be achievable to some extent by producing output tokens that
move the task forward towards some end result. However, this is a double edged
sword as the cost per answer is high if the reasoning is not concise. See a
YouTube video by `@t3dotgg`  for more information: [I was wrong about
GPT-5](https://youtu.be/k68ie2GcEc4?si=0O6pBuxyHH5creys).

Why select this puzzle instead of a simple, well-worn exercise such as: `Let
𝑘=4`, `(𝑛^2+3𝑛+5) mod r`, `r∈𝑍`, `𝑛=𝑘` and `𝑛∈𝑍`? Although such tasks are quick
generate, they are also very familiar. And it reduces to a fixed sequence of
steps, that can be reused on variants of the problem. Or entirely skipped by
handing the expression to a calculator. In the end, it’s just concise Haskell.
An LLM can classify the input as a Mathematica-like computable expression,
directly yielding the result. In practice, parsers can construct an abstract
syntax tree (AST) for the expression, and most of the semantic annotations
required for execution are either recoverable from the structure or explicit in
the grammar.
The AST implicitly encodes type information: for example, no mathematical
parser interprets the `+` operator as string concatenation, so the digits on
either side of the infix operator are necessarily of type number. As a result,
this kind of test can be trivially solved by a non-reasoning system, or reduced
by a reasoning model to just three steps: identify the parameter, retrieve the
appropriate script, and invoke it with the parameter to obtain the result. For
small values of `𝑛` or `r`, the computation could even be precomputed and
stored in a lookup table. Alternatively, the script itself could be cached at
the token level, by respecting known parameters. In practice, a finite-state
automata combined with a calculator (ACU) is sufficient to solve this test.

## Implementation notes

> While the software is in development (v0.*), when incrementing a minor version
I may intentionally break the interface to aid the development. If you would
like an LTS or stable release, please get in contact.

It’s worth noting that many of the mechanics operate on a 50% chance of
activation. This means that even at the highest level, there is a real
possibility that the test output will be simple—some tests remain trivial to
solve regardless of difficulty. To obtain meaningful results, a large number of
tests must be run, as the majority are expected to fail. For example, when the
mapping order is left-to-right rather than right-to-left, the LLM tends to
produce more correct answers.

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

If the test code and the pangram list is known, then based on the position of
the missing word, the chance of guessing the correct input is
`1/pangrams.length`. A testee should therefore achieve at least this level of
accuracy; otherwise, its reasoning is performing worse than random guessing.
The default pangrams list length is `9`.

In addition, tests are often simple once excluding native tool calls, requiring
the steps: two lookups, complete the word, find the token, pick the side to
choose the token, and that's your answer. Additional features, may require
running a function (tool call) over the input, or will only be activated with a
50% chance.

If you need to read all the words of the active pangram you may make ~60 lookup
actions. This number does not scale with the number of input words, but with
the size of the chosen pangram.

## Why was this created

I noticed that all AIs seem to fail using the tools that I use. I wondered if
it was because of the lack of public information to train them on. This test
proves it. This was prior to Chat GPT 5.

## Usage

- [Create a Codespace](https://docs.github.com/en/codespaces/developing-in-a-codespace/opening-an-existing-codespace)
- Then simply, run the command `llmtest` in the terminal.

### Installation

`npm install node-llm-test`

### Programmatic Usage

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

### CLI usage

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
| `--level <integer>`          | Features enabled (0=none, 2047=all, default: 0)     |
| `--seed <integer>`           | A seed to preserve reproducibility                 |
| `--no-print`                 | Do not print the output for the LLM                |
| `-i, --interactive`          | Run in interactive mode                            |
| `--wordlist-file <filepath>` | Load wordlist from a file                          |
| `--answer <string>`          | Provide answer via arguments, implies --no-answer  |
| `--no-answer`                | Do not wait for an answer on stdin                 |
| `--verbose`                  | Print more debug information                       |

---

## Test Levels. Worked example

I recommend trying the game out at a low level and word count, at least
once. Some information is omitted here. See web app link at the top of file.

Given commands may not be reproducible unless, you happen to be one the same
version.

### Reference

| Flag name (source)             | Value (decimal / binary) | What it does (plain English)                                                                      | Example behavior                                                                                               |
| :----------------------------- | -----------------------: | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| `CHAOS_WORDS`                  |              `1` / `0b1` | Increases output word count (roughly `words_in_domain * 2`) to make text longer/more chaotic.     | If domain has 50 words, output may include ~50 extra words scattered through the text.                        |
| `MULTIZE_TOKENS`               |             `2` / `0b10` | Duplicates tokens used to increase token density/length.                                 | A token like `cat` might become `cat cat`.                                           |
| `EXCLUDE_MAPPING_INFO`          |            `4` / `0b100` | Omits mapping/metadata information (e.g., token→map direction) from outputs.                      | Instead of returning the details in text, the response omits the info.
| `MULTIZE_I_TOKENS`             |           `8` / `0b1000` | Similar to `MULTIZE_TOKENS` but targets `input words`.           | `quick` becomes `quick brown` |
| `PARTIAL_REASINING`            |         `16` / `0b10000` | Emits partial or reasoning instead of a full consolidated explanation.                   | Output shows only part of the token. The reset must be infered. |
| `INDIRECT_SYMBOLS`             |        `32` / `0b100000` | Transforms tokens via a symbol function (e.g., ROT13 or other symbolisation) to obfuscate tokens. | Words may be ROT13-encoded or replaced with binary equivalents.                                  |
| `EXCLUDE_SENTENCE_SPACES`      |       `64` / `0b1000000` | Removes spaces between words.                        | `"one two"` → `"onetwo"`  |
| `INSTRUCTION_ORDER`            |     `128` / `0b10000000` | Randomly alters the order of instructions before printing.              | Instruction list may be reordered, affecting how instructions are interpreted/executed.                        |
| `OUTPUT_SHIFT`                 |    `256` / `0b100000000` | Applies a character/token shift (e.g., Caesar-like) to the output; decoding is required.      | Plain text is shifted by N characters; consumer must reverse the shift to read original text.                  |
| `OUTPUT_SHIFT_EXLCUDE_DETAILS` |   `512` / `0b1000000000` | With `OUTPUT_SHIFT`, additionally excludes metadata about the shift (magnitude/direction).        | Output is shifted and no shift metadata is returned; decoder must infer shift by analysis.                     |
| `MAPPING_INFO_PUZZLE` | `1024`/`0b10000000000` | The expression order is changed based on a maths puzzle. |  |


### Extra notes & usage tips

- **Combining flags:** these are bit flags — combine with bitwise OR (for
  example `flags = CHAOS_WORDS | INDIRECT_SYMBOLS`), and test membership with
  bitwise AND.
- **Behavioral intent:** many flags control _how_ tokens are transformed,
  obfuscated, or how reasoning is revealed. Treat them as test modes to probe
  model robustness (e.g., obfuscation, partial reasoning, reordered
  instructions).

### Level 0

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
