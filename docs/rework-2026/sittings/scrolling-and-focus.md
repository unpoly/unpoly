# Scrolling & focus chapter sitting (2026-10-15, full read per decision R1)

- Chapter stays together (split into Scrolling and Focus considered and rejected: both answer where the user ends up after an update, and the APIs mirror each other; not a leftover of the up.viewport module).
- All overviews: closing section renamed to "See also"; it carries both minor in-topic pages and pointers to other topics, never a read-more box for another topic (documentation guide updated). Replaces "Also in this topic" and /history's "In other topics".
- /scrolling-and-focus: unchanged otherwise. No combined reveal + focus example in the scrolling section (it would dilute the section and use [up-focus] before it is introduced).
- /scrolling: unchanged (both pointers to /scroll-tuning stay).
- /scroll-tuning: padding section names [up-reveal-padding] for its HTML example, { revealPadding } for JavaScript. The packet's revealPadding code bug was already fixed in 1d30c72be.
- /focus: pointer-only "Styling focus states" section dropped; overlay subsections stay.
- /focus-visibility: unchanged.
Chapter done.
