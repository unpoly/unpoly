# Motion chapter sitting (2026-10-15, full read per decision R1) — PAUSED

- Chapter "Animation" (one page) split into "Motion" (7367ce25c): /motion (overview), /transitions, /animations, /controlling-motion. Split by effect kind; shared settings (duration/easing, reduced motion, running code after, finishing) on /controlling-motion, with one-sentence pointers from /transitions and /animations. /animation redirects to /motion; anchor shims on the overview.
- B18 → cut the layout sentences from the first transition example ("How a transition plays" owns them).
- /motion: sections named "Transitions", "Animations", "Controlling motion"; up-duration example added; "knows" → "has" (72b6d1b51).

## Resume here
- /transitions (page 2 of 4), presented, no decision yet:
  - Drop the duplicate definition at transitions.md:20 ("An effect that morphs between an old and a new element is called a *transition*."); lean strong.
  - Lower: rename first H2 "Morphing between old and new" (e.g. "Using a transition", keep {#transitions}); lean weak.
- Then /animations, /controlling-motion, then log and close the chapter.
- Remaining chapters after Motion: Scripting, Backend integration, Advanced rendering.
