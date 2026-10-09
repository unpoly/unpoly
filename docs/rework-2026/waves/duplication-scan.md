# Duplication scan (2026-10-09), findings pending Henning
1. polling #detecting-unchanged-content ↔ conditional-requests (~40 lines). Owner conditional-requests; cut polling to 3-4 line teaser.
2. subinteractions #result-values ↔ closing-overlays #result-values (~30 lines). Owner closing-overlays; move "accepted by → value" table there; subinteractions one sentence + example + link.
3. start/api ↔ attributes-and-options #layers/#config (~40 lines, 11 identical). GS page; accept or trim start/api to three-layer example + one line.
4. enhancing-elements #no-load-event ↔ legacy-scripts #migrate-to-compiler (~20-25 lines, same lightbox example). Two sentences + link; #integrating-libraries gets a different example.
5. validation #backend/#script ↔ reactive-server-forms #server/#script (~35 lines). Owner validation; reactive shows only what differs + link.
6. overlay modes table in overlays, opening-overlays, customizing-overlays. customizing-overlays #modes → one sentence + link (keep config sentence).
Borderline accepted: history overview generous (best tightening candidate); scrolling-and-focus nav defaults; network cache section; handling-all-links/forms sibling sections; islands/preserving-elements keep; providing-html/templates; others (see agent report).
