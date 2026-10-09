# Wave 3 writer reports (condensed)

## Backend integration (2050f8f6d..8e07444b9)
Vary tables moved caching.md → optimizing-responses #vary/#cache-matching (shims kept). skipping-rendering dissolved (redirect → /conditional-requests); "Preventing rendering of loaded responses"+"Global skipping rules" moved VERBATIM into render-lifecycle.md as "### Skipping a loaded response {#skipping-responses}" (Advanced rendering writer must integrate).
Title change: handling-asset-changes → "Reacting to new deployments".
Recommendations: vocabulary swap AGAINST (maybe retitle /server-bindings "The server protocol" only); liberate header reference: YES cheaply (API index "HTTP headers" group; keep doc comments in protocol.js); up.protocol learn-refs gain server-bindings in sweep.
Unverified: If-None-Match precedence (HTTP semantics); protocol implementations set Vary / _up_method generically.
Fixed by orchestrator: script.js:1000 dead anchor, :961 meta value→content (b6fec9c36).
Ref bugs: fragment.js:228 + protocol.js "in answered with"; protocol.js X-Up-Fail-Context copy-paste; protocol.js:1016 grammar.
