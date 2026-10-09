# Wave 3 writer reports (condensed)

## Backend integration (2050f8f6d..8e07444b9)
Vary tables moved caching.md → optimizing-responses #vary/#cache-matching (shims kept). skipping-rendering dissolved (redirect → /conditional-requests); "Preventing rendering of loaded responses"+"Global skipping rules" moved VERBATIM into render-lifecycle.md as "### Skipping a loaded response {#skipping-responses}" (Advanced rendering writer must integrate).
Title change: handling-asset-changes → "Reacting to new deployments".
Recommendations: vocabulary swap AGAINST (maybe retitle /server-bindings "The server protocol" only); liberate header reference: YES cheaply (API index "HTTP headers" group; keep doc comments in protocol.js); up.protocol learn-refs gain server-bindings in sweep.
Unverified: If-None-Match precedence (HTTP semantics); protocol implementations set Vary / _up_method generically.
Fixed by orchestrator: script.js:1000 dead anchor, :961 meta value→content (b6fec9c36).
Ref bugs: fragment.js:228 + protocol.js "in answered with"; protocol.js X-Up-Fail-Context copy-paste; protocol.js:1016 grammar.

## Backend critic (85aa319e8, 219ab2d67): all 5 READY. Build OK, URLs 78/78.
Fixed: overclaims "never full page load"; X-Up-Expire-Cache can't narrow/disable request-time expiry; _method wrapping applies to AJAX by default; Vary set only by some implementations.
Judgment calls (lean): 1 server-bindings bold lead-ins (keep or H3s); 2 conditional-requests blurb (lead with 304 benefit); 3 ETag tip vs Rails masked CSRF tokens (caveat or drop); 4 render-lifecycle #skipping-responses lead with event.skip() (Advanced rendering batch 2); 5 no objection to writer's recommendations.
Ref bug for Henning: X-Up-Expire-Cache: false documented as override in protocol.js + caching.md:134 but can't undo request-time expiry (code or docs?).
For batch 2 writer: render-lifecycle #skipping-responses integrate, lead with event.skip().

## Advanced rendering batch 1 (67f119ca8..2b4aff63e; site 533fb4a5)
Rename navigation → navigation-defaults done (60 links; /navigate,/navigating collapse). Title "Navigation" → "Navigation defaults".
Fixed: navigateOptions fallback ':main' → true; class=".content" dots; [up-link=region] → [up-match=region]; target-derivation real deriver list.
Unverified: navigation-defaults focus 'auto' row simplification; validate/poll rows non-navigation.
Ref bugs: fragment.js ~2595 :layer doc says :target twice; up:fragment:loaded example uses headers['X'] vs header(); renderOptions experimental omitted.

## Advanced rendering batch 2 (226820591, 6e8cb3d3a, 37636c860) — critic NOT yet run (paused for quota)
Fixed: event.newElement → newFragment; class=".target" dots; onFinished link; up-target="/target".
render-lifecycle: #skipping-responses leads with event.skip(); failed response rejects with RenderResult, onError not run.
Unverified: same-data "client changes to data ignored" (macro order TODO fragment.js ~1138).
Ref bugs: fragment.js up:fragment:keep example (~998) element/newElement; render_job.js example invalid JS + job.options → renderOptions; lifecycle-hooks.md onError note.

## Advanced rendering critic (af02b6244): all 8 READY. Build OK, URLs 78/78.
Fixed: overview navigation claim qualified (main swaps); <select value> → <option selected>; providing-html up.navigate claim; render-lifecycle up.layer.ask(string) → options.
Judgment calls (lean): 1 #skipping-responses "not an error" only for successful responses (add half sentence); 2 failed-responses "request aborted" bullet (drop/reword); 3 fallback as fail variant (leave); 4 error example addEventListener inside try (move above); 5 #handling-fatal-network-errors mention up:fragment:offline too.
Ref bug: fragment.js:765 up.layer.ask('/sign_in', {...}) string arg (fix example or accept (url, options)).
Hub specs adjusted for single-page Animation + up.util signatures (site fc39f038). Border radii unified (site 4d5a4c17).
