# Prose review brief (shared by all reviewers)

You review a slice of the new Unpoly documentation for prose quality. READ-ONLY: do not edit any file in /home/henning/Projects/unpoly or /home/henning/Projects/unpoly-site. Write your findings to the output file named in your prompt (in the scratchpad) and return them in your final message as well.

Repo: /home/henning/Projects/unpoly (branch docs-rework). The API reference consists of the `/*- ... */` doc comments in src/unpoly/**/*.js; each becomes a page. Only review the prose inside those doc comments (and in guide pages / site pages if your slice names them). Ignore code and ordinary `//` comments.

## Read first (binding style rules)
Read the "Writing style" section of /home/henning/Projects/unpoly/docs/contributing/documentation.md (search for "### Writing style"). Key points: short declarative sentences, value first, concrete, no em-dash connectives, no closing summaries, open with what the topic is. HOUSE STYLE, NOT A FINDING: passive voice and software-as-actor ("the fragment is updated"), adverbs like "automatically"/"optionally", definition lists with bold lead terms, admonitions (`> [note]`), "See X for details" pointers, enumeration ("there are three ways"), lead paragraphs saying what a page covers, pedagogical tone, technical senses of "framework"/"robust"/"ecosystem".

## Check for
1. AI tropes / slop: "not X but Y" contrasts, staged openers ("Here's the thing"), forced triads for rhythm, one-line punchy closers, closers that restate their section, inflated or sales language ("seamless", "powerful", "effortless"), stock AI words (delve, robust, leverage, crucial, "ensure" everywhere), em-dash chains, filler, rhetorical questions, hedging stacks, dramatic sentence fragments, staged rebuttals of beliefs nobody stated. The maintainer is a non-native speaker who wants plain, concrete English.
2. Inconsistent terms for the same concept. Reserved terms in Unpoly:
   - "reveal" = scrolling an element into view (up.reveal, [up-scroll]). Must not be used for animations/showing.
   - "background request" = [up-background] / { background: true } (low priority, no progress bar). "in the background" must not be used loosely for ordinary link/form requests.
   - "transition" (morphing old→new fragment) vs "animation" (single element) vs "effect"/"motion" (either kind).
   - "error response" (response with an error status; page is /error-responses) vs the older "failed response".
   - "keeping elements" ([up-keep]) vs the older "preserving elements".
   - "CSP nonce" vs the older "document nonce".
   - Watch for drift between: "render pass" / "fragment update" / "update"; "overlay" / "layer" / "modal" / "dialog"; "main element" / "main target" / "main content"; "origin" vs "the link the user clicked"; "navigation"/"navigating"; "compiler" vs "initializer"; "fragment" vs "element"; "target" vs "selector".
   Report a term finding only when the same concept is named differently in a way that could confuse a reader, or a reserved term is misused. Give file:line for each occurrence.
3. Sections that are hard to understand for a human reader: dense paragraphs that assume knowledge not introduced yet, unclear references ("it", "this"), steps out of order, examples that don't match the prose, headings that don't describe the section, parameter descriptions that only restate the name.

## Report format
Significant findings only (skip nitpicks; one isolated awkward sentence is not significant unless it misleads). Group as:
(A) AI tropes: per pattern, representative locations (file:line + a short quote), and how widespread in your slice.
(B) Terminology: per concept, the variants found with file:line, and a suggested canonical term.
(C) Hard-to-understand sections: file:line (or doc comment name, e.g. `up.render()` / `[up-follow]`), what is hard, a one-line suggestion.
Rank within each group by impact. Use absolute paths. Keep the report under ~1500 words; the file may hold more detail.

Work in batches (read files with Read or `sed -n`), and append running notes to your output file as you go so nothing is lost. Do the reading yourself; do not spawn further agents.
