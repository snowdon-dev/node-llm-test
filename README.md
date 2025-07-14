# node-llm-test

- See the video I made this for at: <https://youtube.com/@snowdon-dev>.
- See the web app at: <https://marketeer.snowdon.dev/tools/llmtest-online/>.

<!--toc:start-->
- [node-llm-test](#node-llm-test)
  - [The puzzle](#the-puzzle)
  - [Notes about the implementation](#notes-about-the-implementation)
  - [Why was this created](#why-was-this-created)
  - [Install](#install)
  - [Programmatic Usage](#programmatic-usage)
  - [CLI usage](#cli-usage)
  - [An example of deep reason failure](#an-example-of-deep-reason-failure)
    - [Gemini 2.5 Pro (gets close)](#gemini-25-pro-gets-close)
    - [ChatGPTs answer](#chatgpts-answer)
    - [Thoughts](#thoughts)
    - [ChatGPTs thinking](#chatgpts-thinking)
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

Importantly, while each test is deterministic given a fixed wordlist, seed, and
code version—meaning the same inputs will always produce the same encoded and
decoded sentences—this determinism can break if the code version changes or the
underlying wordlist is updated. To preserve reproducibility, I can provide
options for using a static wordlist and locking the process to a specific code
tag. Let me know if you'd like support for that.

## Why was this created

I noticed that all AIs seem to fail using the tools that I use. I wondered if
it was because of the lack of public information to train them on. This test
proves it.

## Install

`npm install node-llm-test`

## Programmatic Usage

```javascript
import { prepare, print } from 'node-llm-test';

const {
  tokenMap,
  partialTokenizedSentence,
  expression,
} = prepare();


print(partialTokenizedSentence, tokenMap, expression, console.log);
```

## CLI usage

To run the CLI `npm run run`.

| Argument | Parameters | Description |
| -------------- | --------------- | ------------- |
| `--number <number>` | Integer (I.e. 600), default 200 | The number of words in the wordlist |
| `--write [filepath]` | Boolean or string, default false | write to a temporary file or the target path|

---

## An example of deep reason failure

### Gemini 2.5 Pro (gets close)

For some reason it picks - `'protege' ** 'veinage'`, but the correct answer is
`fear`.

```txt
Symbolised sentence with missing word:
[...] jaunt librate pyic Yuan of examining protege
The correct answer is:
fear jaunt librate pyic Yuan of examining protege
The real sentence is:
Big fjords vex quick waltz nymph
```

```txt
Dissecting the Substitution

I've been examining the table to decipher the substitution cipher. The format
is clear: "word1" ** "word2", indicating a direct mapping. My focus now is on
identifying patterns within the mappings, specifically recurring words or
sequences, to determine the underlying structure of the cipher. I'm looking for
clues to crack it.

Decoding the Sentence

I'm now focused on working backwards through the mapping table to decode the
provided symbolised sentence.  My strategy is to find the source words that map
to each of the encoded words in the sequence.  This requires a reverse lookup
in the mapping table, which I've started to construct. The goal is to identify
the source pattern and then determine the missing "symbolised" word. I believe
identifying the pattern is the key.

Deciphering the Sequence

I've made significant progress by focusing on the sequences within the mapping
table. Examining "examining protege" together reveals its origin, "nymph",
indicating these words function as a unit within the cipher. This confirms the
importance of identifying phrases. Next, I need to analyze the beginning of the
sequence to solve the puzzle, and determine where the missing word should
originate.

Identifying the Root Phrase

I'm now focusing on a more exhaustive search of the mapping table, specifically
looking for multi-word mappings that might correspond to longer sequences
within the symbolised sentence. The goal is to identify a source phrase that,
through a series of substitutions, produces the target sequence. By starting
with the known phrase, "examining protege," and working backwards through the
mappings, I hope to uncover the pattern that can be extended to find the
missing initial segment. This reverse mapping table is becoming increasingly
important.

Mapping the Puzzle Pieces

I'm now tracing the symbolised sentence back to its original form using the
mapping table. It appears that the source words don't map directly, but are
likely the results of sequential, or overlapping mappings.  I'm focusing on the
"examining protege" sequence, which decodes to "nymph," to better understand
how the mapping operates on word groups within the overall phrase.

Solving the Cipher

I'm now focusing on a more systematic approach to decode the cipher,
concentrating on identifying longer phrases and their corresponding mappings.
My goal is to work backwards from the known sequence "jaunt librate pyic Yuan
of examining protege" and uncover the source phrase that corresponds to it.
This requires a deeper dive into the relationship between the words. I'm trying
to determine if there are single mappings for word groups.

Revising the Decoding Approach

I've shifted my focus to a chain-of-thought strategy, assuming a sequential
substitution process. The goal is to work through the mappings to identify the
initial word. I'm prioritizing the end of the symbolised sentence, tracing the
steps back. This feels like the right track. I'm focusing on the sequential
nature of the mappings. I believe I am close to solving it.

Analyzing the Mapping Table

I'm now focused on the underlying structure of the word mappings. Initially, I
thought that I had to trace each word independently. But with more analysis, I
can see now that the sequence must map to a complete, final string. So I'm now
testing for source strings. My new focus is to identify the root phrase in the
mappings.

Tracing the Transformations

I'm now analyzing the output string to identify a series of transformations. It
appears the mappings don't directly substitute words, but instead, sequences of
them. I'm looking at 'jaunt librate pyic Yuan of examining protege' to see if a
combination of source strings will create it. Currently, it's not clear which
mapping provides the correct source.

Re-evaluating the Cipher

I'm now focusing on a combined approach, using a combination of the mapping
table and examining word patterns. I'm focusing on the sequence jaunt librate
pyic Yuan of examining protege and trying to find the source phrase by tracing
backwards from the sequence examining protege. I believe that the answer is
found within the mappings, but not directly. The key is in identifying the
correct group of words.

Tracing the Decryption Path

I've been re-evaluating the decoding strategy, focusing on identifying the core
transformation that results in the sentence. Given the mappings' nature, I'm
now certain there is an initial string to the symbolised phrase and that the
sequence of words builds up to form the overall phrase. Using this pattern
should help me.

Examining the Mappings

I've been meticulously analyzing the mappings to understand how words are
transformed into sequences. I've noted that certain word groups, such as
"examining protege," are consistently treated as cohesive units, which suggests
a hidden structure. I'm focusing on the sequential nature of the mappings and
believe I am close.

Decoding the Source Sequence

I'm now focused on understanding the original phrase, working backward from the
symbolised sentence. The key is in identifying the originating word sequence
that produces jaunt librate pyic Yuan of examining protege. I'm systematically
tracing each term in the sentence to find its source mapping, and then trying
to chain them together to determine the root phrase. This looks like the right
approach.

Decoding the Sequence

I've been working through the mapping table to understand the transformation
process. It's clear now that sequences of words map to other sequences, not
single words. I've successfully identified "examining protege" as "nymph" and
now I'm attempting to decode the remaining segments of the sentence, working
from the known mappings. I need to understand how the sentence transforms in
reverse.

Decoding the Source

I've traced the entire sentence backward, breaking it down into smaller,
traceable parts, and their likely origins. By meticulously reversing the
transformations, I've narrowed down the beginning of the symbolised sentence,
which is now clear. I've found a sequence of key words.

Decoding the Sequence

I'm now applying a chain-of-thought approach, attempting to trace the mappings
backward to identify the starting point. I've begun unraveling the end of the
symbolised sentence and am looking at the words that create the final string. I
have identified "examining protege" as "nymph", and I'm using this as a
starting point.

Deciphering the Path

I'm focused on tracing the symbolised sentence back to its source, using the
mappings to understand the transformations at each stage. Starting from the
known sequence "jaunt librate pyic Yuan of examining protege," I'm now
exploring the potential of a sequential transformation process. I'm getting
closer to unlocking the initial phrase.

Mapping the Cipher

I'm now refining the decoding strategy by identifying the core root of the
cipher's sentence. I have analyzed the entire "jaunt librate pyic Yuan of
examining protege" sentence to isolate the starting word. The key is to find
the original source words for each mapping. I am close.

Decoding the Sequence

I'm now tracing the path from the end of the symbolised sentence back to its
origin. Each word in the sequence has a corresponding mapping. I need to
reverse these to decode the source and identify the missing starting word. I am
focusing on the phrase "examining protege" as a key.

Decoding the Sequence

I'm now tracing the path from the end of the symbolised sentence back to its
origin, leveraging the mapping table and a chain-of-thought approach. I've
broken down the sentence into components and am working backwards to identify
the corresponding mappings. The phrase "examining protege" maps directly to
"nymph," which provides a key anchor for decoding.

Decoding the Root

I'm now back at the mapping table to figure out the origin of the initial
phrase. I've broken down the symbolised sentence into core components: fjords
vex quick waltz nymph. Now I'm focusing on tracing the mappings to understand
the starting point. I believe uncovering the sequence's genesis is key to
unlocking the puzzle.

Decoding the Origin

I'm now tracing the root phrase, focusing on the mappings. The starting phrase
is key, which I've isolated as a chain of words in their own right. From these
words, my goal is to trace the transformations needed to derive the entire
symbolised sentence.  I'm confident I am getting closer to the solution.

Decoding the Puzzle's Genesis

I'm now tracing the symbolised sentence back to its source, meticulously
building the chain of transformations.  I've pinpointed "fjords vex quick waltz
nymph" as the intermediate step, but I'm still working towards decoding the
root phrase, employing the mapping table as my guide. I'm focusing on the first
word in the sentence.

Refining the Mapping

I'm revisiting the initial mapping breakdown, recognizing the sentence isn't a
direct word-for-word translation. Instead, I'm focusing on the sequential
transformation, aiming to decode backwards from 'examining protege' to identify
the source word. I'm building a more robust reverse lookup to validate the
starting hypothesis. This approach feels more promising.

Decoding the Root

I've been meticulously tracing the transformation process, now focusing on
identifying the starting point of the symbolised sentence, which is the
sequence jaunt librate pyic Yuan of examining protege. By working backwards
through the mappings, I've isolated the core words in the initial sequence:
fjords vex quick waltz nymph. Now I must find the original source of this.

Refining the Approach

I'm now refining the decoding strategy by identifying the root sequence.  My
goal is to find the original words that map to jaunt librate pyic Yuan of
examining protege. I am confident that the key lies within the mappings.

Identifying the Genesis

I've traced the symbolised sentence back to its source, using the mappings to
understand the transformations at each stage. Starting from the known phrase,
"examining protege", I'm now exploring the potential of a sequential
transformation process to unravel the phrase.

Deciphering the Path

I'm now certain the solution lies in a multi-step decoding process. After
numerous iterations, I've tracked the symbolised phrase back, word by word,
through numerous, complex mappings. While the initial word eludes me, I'm
confident in the overall chain of transformations now.

Reconstructing the Sequence

I'm now tracing the symbolised sentence back to its root. Starting with the
visible components, jaunt librate pyic Yuan of examining protege, I'm
methodically unravelling the mappings, aiming to find the initial sequence.
Each step reveals the origins of the next, leading me closer to identifying the
missing initial word.

Refining the Path

I'm revisiting the initial mapping breakdown, recognizing the sentence isn't a
direct word-for-word translation. Instead, I'm focusing on the sequential
transformation, aiming to decode backwards from "jaunt librate pyic Yuan of
examining protege" to identify the source word. I am certain that identifying
this word is key to solving the problem.

Decoding the Root

I'm now certain I've traced the symbolised sentence back to its source, using
the mappings to understand the transformations at each stage. Starting from
"examining protege," and working backwards I'm now exploring the potential of a
sequential transformation process to unravel the phrase.

Deciphering the Origin

I've been meticulously tracing the symbolised sentence, dissecting the mappings
to understand the initial word. Focusing on the word groups, it seems
"examining protege" transforms into "nymph." Now, I'm working to identify if
any other group transformations could be the missing start.

Identifying the Root Word

I've been meticulously tracing the symbolised sentence, recognizing "jaunt
librate" originates from "fjords." Building upon this, I'm now certain the
complete source sentence begins with a word which is mapped to the final
sequence and thus is the solution. My focus is now on identifying this initial
root.

Re-examining the Decoding

I'm now focusing on the known sequence to find the underlying chain. By
scrutinizing the mappings and working backwards from the symbolised words, I'm
getting closer to deducing the origins of the sentence. Using the key mappings,
my analysis concentrates on the genesis of the transformation, leading me
closer.

Analyzing the Transformation

I'm now back at the mapping table to focus on the structure of the sentence,
particularly tracing the path from the end to understand the mappings. I
believe the answer is contained in the transformations. By looking at the [...]
jaunt librate pyic Yuan of examining protege sequence, I hope to isolate the
core word.

Decoding the Origin

I'm now certain the correct sequence is a chain. Beginning with the key words,
I've broken down "jaunt librate pyic Yuan of examining protege" into individual
component mappings. This strategy now hinges on meticulously reconstructing the
full, starting phrase from these transformations.

Analyzing the Cipher

I'm now diving into the underlying mappings, focusing on how the sequence
builds. I'm exploring different patterns and attempting to identify a core
group of key words and then reverse engineer how it fits into the "jaunt"
sentence. This will hopefully help uncover the original sentence.

Analyzing the Transformations

I've been meticulously analyzing the mappings to understand the sentence's
building blocks. Starting with the end and working backward, I hope to decipher
how "jaunt librate pyic Yuan of examining protege" was constructed. The pattern
seems to involve sequential mapping, making the puzzle a complex chain.

Decoding the Puzzle's Genesis

I'm now tracing the symbolised sentence back to its source, meticulously
building the chain of transformations.  I've pinpointed "fjords vex quick waltz
nymph" as the intermediate step, but I'm still working towards decoding the
root phrase, employing the mapping table as my guide.

Decoding the Sequence

I'm now certain the "symbolised" sentence is a coded sequence, not a direct
translation. Recognizing that "examining protege" maps to "nymph" is key. My
strategy shifts to deconstructing this sequence. The challenge is tracing the
transformation from an unknown source to the words I can see. I will break this
puzzle down.

Reconstructing the Solution

After extensive decoding and pattern recognition, I'm confident I've traced the
solution's core. The key phrase 'jaunt librate pyic Yuan of examining protege'
likely originated from a series of sequential transformations, with 'fjords'
acting as the root word. Now, my focus is solidifying the path from 'fjords' to
the final sequence.

I'm focusing on the sequential transformation, aiming to decode backwards from
"jaunt librate pyic Yuan of examining protege". I've broken down the mappings
and their dependencies. I'm building a system to interpret multi-word mappings.
This approach feels promising, but the complexity of the reverse process
remains a challenge.

Decoding the Final Step

I'm now tracing the symbolised sentence back. I've broken down jaunt librate
pyic Yuan of examining protege to the sequence fjords vex quick waltz nymph.
Decoding further to find the original words: 'zincous' ** 'fjords' and 'nymph'
** 'examining protege'. I'm close to uncovering the key initial word.

Deciphering the Code

I've been working through the mappings to identify the base pattern. It's
becoming clear that the symbolised sentence isn't directly a word-for-word
substitution, but a result of a sequence of chained substitutions. I'm focusing
on "anthine" to see if I can isolate a clear, initial word from the table.

I'm now focusing on re-evaluating the decoding path and trying to determine the
pattern using a systematic, reverse-mapping process. It looks like "anthine"
plays a key role, which should map to the missing phrase. The challenge is in
the multi-word mappings that might hide a simple underlying pattern.

I'm now attempting to use the existing analysis to work backwards. I'm building
a system to interpret multi-word mappings more cleanly, by tracking all
sequences and their components. With more focus, I can solve for "jaunt librate
pyic Yuan of examining protege" and get the solution.

Reconstructing the Original

I'm focusing on the puzzle's crux: identifying the initial word from the
complete, given sequence. My goal is to work backwards through the established
mappings, recognizing patterns in the symbol substitutions and multi-word
transformations. I'm close to a solution.

Reaching the Source

I'm now tracing the symbolised sentence back. I've broken down "jaunt librate
pyic Yuan of examining protege" to "fjords vex quick waltz nymph," and found
its pre-mapping: "zincous kiddush whorish cise dronage." Now I must trace these
words to their origin, looking for a clear starting point in the mappings.

Analyzing the Transformation

I've been meticulously analyzing the mappings to understand the sentence's
building blocks. Starting with the end and working backward, I hope to decipher
how "jaunt librate pyic Yuan of examining protege" was constructed. The pattern
seems to involve sequential mapping, making the puzzle a complex chain.

I've been working backward, meticulously tracing the symbolised sentence: jaunt
librate pyic Yuan of examining protege. By deconstructing each word's mapping,
I've narrowed it down to fjords, vex, quick, waltz, nymph. I believe this
sequence is the origin, but I'm now tasked with discerning the initial mapping
for the complete phrase, and there's a strong belief that the answer, W1, is
near.

Analyzing the Transformation

I'm now tracing the symbolised sentence back to its original form, focusing on
identifying the starting word by meticulously retracing the multi-step
transformation process encoded in the table. By mapping the final sequence to
its origins, I'm confident I can identify the missing component. It's a complex
puzzle.

Re-evaluating the Path

I'm now focusing on a combined approach, meticulously tracing the entire
symbolised sequence. I've re-evaluated my decoding method, concentrating on a
key, initial mapping. Using the sequence "jaunt librate pyic Yuan of examining
protege," I'm analyzing the relationships within the table to decode the
cipher, determining that the solution lies within a reverse transformation of
the target string.

Deciphering the Path

I'm now tracing the symbolised sentence backwards, meticulously reversing the
transformations to identify the initial segment. Examining the chain, I believe
each word has a definitive source. I have now isolated the symbolised sequence
as it builds from the initial word. This approach will allow for more concise
answers.

Mapping the Origin

I've traced the symbolised sentence back to a core sequence: "fjords vex quick
waltz nymph". This leads me to believe the final solution hinges on identifying
the initial transformation within the mappings. Focusing on the sequence, I'm
now certain this is the crux of the problem.

Mapping the Origin

I'm now certain the target sentence's structure hinges on sequential
transformations. I've broken it into "fjords vex quick waltz nymph," generated
by "zincous kiddush revisal cise dronage." Now I'm working to isolate the
original sequence that generates this intermediate state to solve for the
missing word.

Analyzing the Genesis

I'm focused on retracing the full symbolised sequence, step by step, from the
terminal phrase. Starting with "jaunt librate pyic Yuan of examining protege",
I've identified key mappings and their component parts.  This approach is
proving crucial in determining the original sequence.

Analyzing the Mapping Table

I'm revisiting the sentence structure, convinced that an iterative mapping
process is key. I believe there's a starting "seed" that transforms into
"fjords vex quick waltz nymph". My current focus is on identifying a single
word that maps to this sequence, which, in turn, maps to the visible sentence.
It's an interesting challenge!

Reconstructing the Genesis

I'm revisiting the strategy of decoding the symbolised sentence. The goal is to
identify how the known sequence, "jaunt librate pyic Yuan of examining
protege," was formed. I'm focusing on tracing back the mappings to understand
the sentence's initial construction. The starting word holds the key.

Identifying the Origin

I'm focused on tracing back the entire symbolised phrase, using all available
mappings to identify the base sequence from which it arose. I need to
understand the relationship between "jaunt librate" and "nymph".

Analyzing the Cipher's Structure

I'm now tracing the symbolised sequence, step by step, from right to left, to
figure out the mappings and find the original phrase. My goal is to use the
existing data to establish the sequence.

Mapping the Solution

After re-evaluating the table, I've determined the initial word maps to fjords.
My focus is on tracing back to the starting sequence by re-examining how fjords
functions in the puzzle. The reverse lookup is becoming clear, and the answer
is forming.

I've been meticulously analyzing the mapping table to decode the symbolised
sentence. Initial decoding of phrases like "examining protege" to "nymph"
offered a foothold. Current focus centers on reverse-engineering the known
sequence to identify a root phrase, assuming a chain-of-thought strategy.
Identifying the starting word for the symbolised sequence is key, and I believe
I'm close to unlocking this puzzle's genesis.

Analyzing the Transformation

I'm now certain the key to solving the cipher lies in understanding the
relationships between the original words and their mapped sequences. The
challenge is in determining the initial mapping that sets off the sequential
transformation, leading to the complete symbolised sentence. The goal is now
focused on finding that initial word.

Re-evaluating the Solution

I'm now focusing on a combined approach, using a combination of the mapping
table and examining word patterns. I'm focusing on the sequence jaunt librate
pyic Yuan of examining protege and trying to find the source phrase by tracing
backwards from the sequence examining protege. I believe that the answer is
found within the mappings, but not directly. The key is in identifying the
correct group of words.

Re-evaluating the Puzzle

I've been re-evaluating the approach, focusing on finding a direct or
sequential link between the words. I'm starting from the final sentence and
looking to break down each word using a reverse mapping table to understand the
transformation process. The key is in tracing the dependencies.

Re-evaluating the Sentence

I've been re-assessing the problem and I think the solution is right in front
of me. After all these steps I have to find a word, a single word to be put on
the start of the phrase jaunt librate pyic Yuan of examining protege, a full
transformation. I see now that it must be the key word that transforms into the
full sequence.

Analyzing the Cipher's Structure

I'm now tracing the symbolised sentence back to its source, using the mappings
to decode the word sequences. By reversing the process I hope to identify the
initial segment. I am getting closer to the solution.

Mapping the Cipher's Roots

I'm now focusing on a combined strategy, working backwards and tracing the
sequence to pinpoint the original word. The focus is on reversing the known
chain, with attention on how to isolate the starting word. The answer may lie
within the mappings.

Analyzing the Cipher

I've been meticulously analyzing the mappings to understand the connections
between sequences. My focus is now on identifying how the word group, jaunt
librate pyic Yuan of examining protege, is constructed through sequential
substitutions. I'm carefully searching for a root phrase.

Analyzing the Cipher's Logic

I'm now tracing the symbolised sentence back to its original source. After
extensive analysis, it seems that to solve this puzzle, I needed to identify
zincous, which then maps to fjords, thus being the starting word that the
symbolised phrase is constructed from.

Mapping the Solution

I'm now certain that the solution requires a specific, single starting word
that creates a cascading effect through the mapping table. By focusing on the
word 'zincous', which maps directly to 'fjords', I believe I've identified the
key to unlocking the puzzle. This initial mapping then chains into the target
sentence.

Deciphering the Cipher

I've been analyzing the mappings table to trace the complete chain. I'm
focusing on "zincous" as a possible source. The goal is to identify how this
leads to the sentence, and the transformation that will uncover the initial
word.

Unveiling the Decoded Phrase

I'm now certain the decoded phrase begins with the word that maps to "fjords."
This word, a single entity within the provided table, represents the key. I am
refining my strategy to find the start and then decode the rest of the puzzle.

Reaching the Solution

After an exhaustive analysis, I've concluded that the puzzle's missing word is
indeed a starting point in a chain, likely "Just," as it uniquely acts as a
key. This leads me to believe the missing "symbolised" word is protege, which
fits the sentence structure and my findings.

I've focused on mapping the pre-final state, fjords vex quick waltz nymph, to
its origins. My working theory is the missing word initiates a chain that
culminates in the visible sentence.  After a thorough analysis of all mappings,
it appears the initial word is protege.

protege
[...] jaunt librate pyic Yuan of examining protege
```

### ChatGPTs answer

```text
Solve Symbolised Sentence Puzzle with Missing Word

% 'subtext' 'sterve' beshag fifteen jump oneyer dozen currant
```

### Thoughts

The correct answer being `starch`.

```txt
Real: Big fjords vex quick waltz nymph

Symbolised: subtext beshag fifteen jump [...] dozen currant

The answer is: subtext beshag fifteen jump starch dozen currant
```

ChatGPT incorrectly notes a mapping from `'subtext'` to `'sterve'`, when in
fact the correct mapping is from `'Big'` to `'subtext'`. It never corrects this
mistake. Interestingly, it does recognize that the decoded sentence is a
pangram, which should be technically impossible under the constraints of the
puzzle. However, it concludes that it’s the *wrong* pangram. I have no idea how
it arrived at that conclusion; it likely guessed, perhaps based on the sentence
length (since no multi-word mappings were present), or possibly from memories
it was instructed not to use. Frequently, it simply assumes the sentence is the
classic "The quick brown fox..." pangram.

### ChatGPTs thinking

```txt
Solve Symbolised Sentence Puzzle with Missing Word ChatGPT I’m working through
mapping "subtext" to an old word, using table data. It’s interesting to see how
these guide us to the right answer.

Searched for subtext word mapping ChatGPT I noticed the search results include
"subtext subthalamic subthalamus subthoracic," which seems unhelpful. Now, I'm
thinking of trying a more specific search like "subtext mapping beshag."

Piecing together Python code to parse the mapping table, focusing on keywords
for efficient searching.

Analyzed with python ChatGPT OK, let me see. The mapping has some odd lines.
Focusing on 'subtext', 'beshag', 'fifteen', 'jump', 'dozen', 'currant' to
clarify old word values.

Analyzed with python ChatGPT I'm noting the realization that 'beshag' might not
be a key alone but could form a key like 'beshag fifteen' in compound terms.

I’m digging into 'beshag' to see if it turns up any interesting details.

Analyzed with python Analyzed with python ChatGPT I'm curious about mapping
entries and found 'fifteen' contexts to help shed light on things.

Analyzed with python ChatGPT I’m examining the mapping of new words to old
ones, focusing on "subtext" mapping to 'sterve.'

Analyzed with python ChatGPT I’m piecing together the 'subtext' to 'sterve'
line in the mapping_text. Looking at the context of earlier mappings could be
revealing.

Analyzed with python ChatGPT I’m mapping out that "subtext" corresponds to
"sterve" and now looking for "beshag".

Analyzed with python ChatGPT I’m examining the 'beshag' encoding, considering
it might involve 'fifteen' or other keys due to previous single quote absence.

Analyzed with python ChatGPT I’m taking a closer look at the term 'beshag' in
mapping_text to find relevant details.

Analyzed with python ChatGPT Looking at how mapping lines start with % ' and
split by newline to locate relevant entries. Progressing through each segment
methodically.

Analyzed with python ChatGPT Noticing potential multiword alignments and
combinations like 'beshag fifteen'.

Analyzed with python ChatGPT I’m verifying the correct spelling of "beshag" or
"beashag" and cross-checking its mapping for accuracy.

Analyzed with python ChatGPT I'm listing new words and checking their mappings,
like 'subtext' to 'sterve' and 'fifteen' to 'yeast Aladfar'.

Analyzed with python ChatGPT OK, let me see. The verb 'jump' aligns with 'vex',
given their shared meanings. Now, let's identify a similar link for "dozen".

Analyzed with python ChatGPT Linking 'dozen' to 'waltz' and examining 'beshag'
for ciphertext clues. Progress is being made through this puzzle, showing clear
leaps forward in analysis.

Analyzed with python ChatGPT I’m mapping out the puzzle, examining new words
like 'beshag' and 'fifteen' to link them with original words and find a
consistent sentence sequence.

Analyzed with python Analyzed with python ChatGPT I'm piecing together how
'yeast Aladfar' maps to 'fifteen'. Considering 'fifteen' as an old word
suggests its absence from a new word sequence, unless the puzzle's rules
differ.

Analyzed with python ChatGPT Shifting focus, I’m mapping each word to numbers
or letters for easier decoding. This could transform complex codes into
simpler, manageable elements.

Analyzed with python ChatGPT I’m piecing together the current maps to unpanel,
ensuring accuracy.

Analyzed with python ChatGPT I’m gathering info on the mappings of 'new' to
'old' words, like 'currant' to 'unpanel'. Considering word mappings like
'sterve' to '???' and '???' to 'vex' might reveal the underlying phrase.

Analyzed with python ChatGPT I’m thinking through whether 'sterve' is a fresh
word or final plaintext, and reversing the new-to-old mapping. Also, I’m
checking for 'beshag' in any mapping to refine the symbolized sentence.

Analyzed with python ChatGPT Let's think it through and assess the need for
clarity in the project.

Analyzed with python ChatGPT Mapping words

Analyzed with python ChatGPT Checking "Sterve" and its context in 'subtext'
mapping.

Analyzed with python ChatGPT I found the subtext to 'sterve' and a stray
occurrence in mapping_text. Interesting to see the pattern here.

Analyzed with python ChatGPT I’m thinking through how "Only" can lead to
"jump", which morphs into "vex" over time, creating a flow that emphasizes
progression.

Analyzed with python ChatGPT I’m thinking about the word "waltz" mapping to
"skimp" and examining the progression of word chains to uncover the missing
word.

Analyzed with python ChatGPT I'm beginning to reformat the lines into a
dictionary of mappings.

Analyzed with python ChatGPT I'm examining the mapping query to confirm if
currant maps to nymph, not unpanel.

Analyzed with python ChatGPT I'm checking the original mapping text for
'<currant>' to see if 'currant' is linked to 'unpanel' or 'nymph'. This will
clarify any discrepancies in the mapping_dict.

Analyzed with python ChatGPT I'm mapping out how 'currant' duplicates could
alter the mapping dictionary's structure, potentially making iterative
deciphering essential for pinpointing the correct mapping.

Analyzed with python ChatGPT I'm curious about the association between "dozen"
and "waltz," and also linking 'waltz' to "skimp."

Analyzed with python ChatGPT Waltz is added to the chain, replacing brief with
skimp: dozen->waltz->skimp.

Analyzed with python ChatGPT Mapping_dict might use nymph as the last value.
New mapping for nymph likely missing.

Analyzed with python ChatGPT I'm piecing together the meanings of "sterve,"
"vex," "skimp," and "nymph." Considering synonyms, phonetic clues, and possible
code shifts to decipher their significance.

Analyzed with python ChatGPT It seems "nymph" surfaces merely as an archaic
term here.

Analyzed with python ChatGPT OK, let me see. The phrase "No, only as old"
likely refers to age, possibly implying someone is as old as they claim or not
older.

Analyzed with python ChatGPT The mapping table appears to be incomplete or
corrupted, hindering the decoding process. The phrase "subtext beshag fifteen
jump [ ] dozen currant" might require a different interpretive approach.

Searched for beshag puzzle ChatGPT I’m piecing together the idea that "beshag"
might be a clue from old English, suggesting "to make shaggy." This could imply
a dialect or code for a hidden phrase.

Searched for sterve vex skimp nymph ChatGPT Refining the search terms to ensure
relevancy and precision.

Searched for subtext beshag fifteen jump ChatGPT I’m piecing together numeric
clues and synonyms to find the meaning of "subtext, beshag fifteen, jump x,
dozen currant." Considering phrases and decoding methods to unlock the hidden
word.

Analyzed with python ChatGPT Refining the approach by searching for 'jump' in
the values of mapping_dict.

Analyzed with python ChatGPT Considering 'jump' values and noting 'fifteen' as
potentially old.

Analyzed with python ChatGPT Trying to replace 'fifteen' with 'yeast Aladfar',
but the mapping may involve flipping columns or treating 'fifteen' as a new
word.

Analyzed with python ChatGPT I'm considering "beshag fifteen jump dozen" for
its unique sound and rhythm, curiosity piqued by its unconventional structure.

Analyzed with python ChatGPT I'm thinking about translating 'beshag' and other
symbols into a secret phrase, possibly a pangram like "the quick brown fox
jumps over the lazy dog".

Analyzed with python ChatGPT I’m gathering info on "brown fox" to "sanai".
Considering pangrams like "the quick brown fox jumps over the lazy dog".
Progressing through synonyms and alternative phrases.

Analyzed with python ChatGPT I’m mapping out clues like 'beshag' and 'currant',
thinking about numeric and contextual hints to reconstruct an underlying
phrase. Progressing toward a coherent solution.

Searched for definition of sterve ChatGPT I’m examining word mappings and
synonyms to decipher a phrase. Considering "starve," "vex," "skimp," and
"nymph," I explore their synonyms and connections.

Analyzed with python ChatGPT I’m analyzing the phrase to understand the
transformations and substitutions between words like 'dozen', 'waltz', and
'skimp', ensuring each step logically leads to the next.

Analyzed with python ChatGPT Mapping 'skimp' to 'tico' as a playful, less
gastronomic term for a wealthy person. This aligns with the Mexican heritage
vibe and humor.

Analyzed with python ChatGPT OK, let me see. I'm mapping 'currant' as new and
'nymph' as old. Is swapping 'nymph' as new a valid option?

Analyzed with python ChatGPT I’m thinking through the potential connections of
the word 'sterve', considering its possible ties to a specific phrase or code
word. The aim is to find a suitable mapping for 'beshag'.

Searched for beshag fifteen jump ChatGPT I explored using a Caesar cipher to
shift the phrase "sterve vex skimp nymph" and considered letter positions and
Roman numerals as potential techniques for decoding.

Analyzed with python ChatGPT Considering one-time pad or cryptarithm mappings
for the phrase, like "brown fox jumps over the lazy dog" or "Gray pig jumped
over the lazy cow," and weighing numerical relevance.

Searched for synonyms of beshag ChatGPT I'm decoding each phrase's synonyms and
trying to identify the missing word with the corresponding symbol. Progressing
through each analysis, I seek connections and patterns.

Analyzed with python ChatGPT I’m evaluating word mappings from 'brown fox' to
'seraph' and 'sanai' to 'seraph'. 'Seraph' categorizes mythic beings like
'nymph'.

I'm mapping out how each letter sequence maps to another, but the mapping is
inconsistent, dropping or combining letters. Old terms and acrostics aren't
yielding clear patterns.

Analyzed with python ChatGPT I’m examining 'beshag', 'fifteen', 'jump',
'dozen', and 'currant' to unlock their meanings and contributions to the
solution, considering cryptographic patterns and synonyms.

Analyzed with python ChatGPT I’m examining word mappings like 'port' to
'subtext' and 'tawery' to 'currant'. The chain extends to 'port' mapping to
both 'serio' and 'subtext', hinting at a non-injective relationship.

Analyzed with python ChatGPT I’m considering word transformations and their
potential chains to uncover the missing word. Using known pangrams might reveal
meaningful patterns or phrases.

I’m testing word mappings, like 'currant' to 'nymph' and 'dozen' to 'waltz', to
uncover patterns in the synonyms used. This helps refine the process of
identifying the missing word.

Analyzed with python ChatGPT Interestingly enough, 'oneyer' is classified as
'for' in the old dictionary. Now, I'm working on mapping 'quick' to 'rapid'.

Analyzed with python ChatGPT I noticed that 'quick' wasn't a match, but
'quickly' was.

Analyzed with python Analyzed with python ChatGPT I'm thinking through possible
mapping methods, considering the words 'nymph,' 'vex,' and 'waltz.' It leads to
a search for an underlying phrase, given the high coincidence of these words.

Analyzed with python ChatGPT Hmm, I’m thinking about 'beshag' and 'fifteen,'
wondering if they originate from older phrases or mappings. This exploration
uncovers connections and meanings from the past.

Analyzed with python ChatGPT I’m working through the idea that the pangram clue
might align the mapping differently. I’m examining the relationships between
old and new mappings, like "waltz" and "dozen," to see if they match up with
the symbols.

Analyzed with python ChatGPT Piecing together mappings, including 'fax', to
decode 'the quick brown fox jumps over the lazy dog'.

Analyzed with python ChatGPT Wondering about connections to "Sphinx of black
quartz, judge my vow," but the symbols don't match. Considering pangrams or
related phrases.

Searched for skimp nymph vex ChatGPT I'm mapping out symbols to phrases,
ensuring each symbol corresponds accurately to words in "Waltz, bad nymph, for
quick jigs vex." This involves mapping positions and verifying consistency
across the phrase.

Analyzed with python ChatGPT I'm thinking through how symbols match words in a
phrase, like 'jump' to 'vex' and 'dozen' to 'waltz'.

Analyzed with python ChatGPT Decoding 'beshag' to mean 'bad' shifts our
approach. This makes me think it's more about interpretation and less about
traditional ciphers.

Analyzed with python ChatGPT OK, let's decode 'Symbol1' to 'jigs' and see if it
maps smoothly to 'symbols1'.

Analyzed with python ChatGPT I’m figuring out how symbols like 'subtext' and
'beshag' might decode to words such as 'waltz' or 'nymph', aiming to match the
phrase's structure.

Searched for bad nymph quick jigs vex ChatGPT I’m looking for the missing
symbol in the phrase based on the pangram "Waltz, bad nymph, for quick jigs
vex." It seems to correspond to one of the words: "bad," "for," "quick," or
"jigs."

Analyzed with python ChatGPT I'm thinking through synonyms for 'quick' to map
it to a symbol. Considering 'oneyer' for 'for', but unsure if it fits the
context.

Analyzed with python ChatGPT OK, let's align the mapping table to extracted
subtext. 'oneyer' suggests 'for', but it's tricky to find 'for quick jigs'
here. Further reviews are essential to confirm.

Analyzed with python ChatGPT I'm thinking through various strategies to tackle
a current issue.

Analyzed with python ChatGPT Considering a multi-word mapping or a "drizzle
Danakil" pattern. The mapping table might lack coverage, yet contextually the
missing symbol seems to likely be "oneyer".

Analyzed with python ChatGPT Mapping terms like 'oneyer' and aligning them to
decipher the sentence seems intricate. Rearranging letters, even if backwards,
doesn't clarify the expected phrase, indicating a nuanced decoding process.

Analyzed with python ChatGPT I’m noting the new mappings: 'sterve' to 'archaic
starve', 'vex', 'skimp', and 'nymph'. Wondering if 'starve vex skimp nymph'
forms an anagram.

Searched for starve vex skimp nymph ChatGPT I'm mapping out 'oneyer' as a
symbolized form of 'for' in the phrase, which aligns with the instructions.
```

---

Here's a punchy YouTube Short title that aligns with current SEO trends:

"If Piracy Is Theft… AI Is a Crime Scene 💀 (Try the Web App!)"

- "AI = Theft? You NEED to See This Test Tool 🔥"
- "LLMs Suck? This App Proves It 💻🚨"
- "If Piracy Is Theft, AI Is a Smash & Grab 🧠💣"
- "This AI Tool Exposes the Ugly Truth 👀 (Free Web App)"
- "Think AI Is Smart? Watch It FAIL Spectacularly 🤖❌"

Description:

Is AI just digital theft disguised as innovation? 🤔 In this quick breakdown,
we reveal why Large Language Models (LLMs) really suck and how the concept of
AI might be the biggest “crime” in tech today. Plus, check out our free web app
that tests AI’s flaws live! If piracy is theft, AI might just be the whole
crime scene. Ready to see the results? Tap in and find out! Hashtags:

```text
#AIExposed #LLMFails #DigitalTheft #AICrime #AIBusted #WebApp
#TechTruth #AIFail #AIvsHuman #AIRealityCheck #PiracyVsAI #Short
```

Notes:

- Why LLM suck with your code but can copy just fine
