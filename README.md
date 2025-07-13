# node-llm-test

- See the video I made this for at: <https://youtube.com/@snowdon-dev>.
- See the web app at: <https://marketeer.snowdon.dev/tools/llmtest-online/>.

<!--toc:start-->
- [node-llm-test](#node-llm-test)
  - [The puzzle](#the-puzzle)
  - [Notes about the implementation](#notes-about-the-implementation)
  - [Why was this created](#why-was-this-created)
  - [CLI usage](#cli-usage)
  - [An example of deep reason failure](#an-example-of-deep-reason-failure)
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

I noticed that all AIs seem to fail using the tools that I use. I wondered if",
this was because of the lack of public information to train them on. This test
proves it.

## CLI usage

To run the CLI `npm run run`.

| Argument | Parameters | Description |
| -------------- | --------------- | ------------- |
| `--number <number>` | Integer (I.e. 600), defafult 200 | The number of words in the wordlist |
| `--write` | Boolean, default false | write to a temporary file |

---

## An example of deep reason failure

### ChatGPTs answer

Solve Symbolised Sentence Puzzle with Missing Word

% 'subtext' 'sterve' beshag fifteen jump oneyer dozen currant

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

```text #AIExposed #LLMFails #DigitalTheft #AICrime #AIBusted #WebApp
#TechTruth #AIFail #AIvsHuman #AIRealityCheck #PiracyVsAI #Shorts ```

Notes:

- Why LLM suck with your code but can copy just fine
