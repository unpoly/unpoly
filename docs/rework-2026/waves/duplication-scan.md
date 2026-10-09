# Duplication scan (2026-10-09), findings pending Henning
1. polling #detecting-unchanged-content ↔ conditional-requests (~40 lines). Owner conditional-requests; cut polling to 3-4 line teaser.
2. subinteractions #result-values ↔ closing-overlays #result-values (~30 lines). Owner closing-overlays; move "accepted by → value" table there; subinteractions one sentence + example + link.
3. start/api ↔ attributes-and-options #layers/#config (~40 lines, 11 identical). GS page; accept or trim start/api to three-layer example + one line.
4. enhancing-elements #no-load-event ↔ legacy-scripts #migrate-to-compiler (~20-25 lines, same lightbox example). Two sentences + link; #integrating-libraries gets a different example.
5. validation #backend/#script ↔ reactive-server-forms #server/#script (~35 lines). Owner validation; reactive shows only what differs + link.
6. overlay modes table in overlays, opening-overlays, customizing-overlays. customizing-overlays #modes → one sentence + link (keep config sentence).
Borderline accepted: history overview generous (best tightening candidate); scrolling-and-focus nav defaults; network cache section; handling-all-links/forms sibling sections; islands/preserving-elements keep; providing-html/templates; others (see agent report).

## Outcomes (Henning 2026-10-09, one by one)
1. Applied: polling section cut to a teaser (701968b94).
2. Left as is.
3. Changed: start/api trimmed to intro + three layers (no attributes/options/config sections, no link line); attributes-and-options #layers rewritten to teach precedence (config < attribute < option), new #relaxed-json subsection, dead #following-all-links anchor fixed (e5508ec0b, 9bed81093, follow-up link to /navigation-defaults).
4. (b) only: enhancing-elements uses a date picker example; lightbox stays on legacy-scripts (19eea2daf). (a) left.
5. Left as is (different examples, pages stand alone). /validation must state the second use case of [up-validate] and link reactive-server-forms (sitting note).
6. Applied: modes table dropped from customizing-overlays (7eafff276).
Borderline list: not pursued.
