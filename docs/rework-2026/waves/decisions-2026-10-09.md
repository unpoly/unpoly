# Henning's decisions, 2026-10-09 (apply round)

1A  Accept ALL critic judgment-call leans in waves/wave1-notes.md, wave2-notes.md, wave3-notes.md
    (the "Judgment calls (lean)" lists). Apply each lean as stated; "keep" leans need no change.
2A  Merge Animation into ONE /animation page (predefined-animations, predefined-transitions,
    motion-tuning fold in; cut overview repetition; ~1800-2000 words; old slugs redirect to
    the absorbing sections' stable anchors via src/unpoly-migrate/.htaccess; toc.yml; repoint
    all links incl. motion.js doc comments). Also critic: soften "the layout around them does
    not jump".
3X  /server-bindings → /server-protocol, title "Server protocol" (redirect; collapse the
    /install/server-bindings chain to one hop; repoint all links). /protocol-implementations
    keeps its name. NO "HTTP headers" group in /api. New @signature markers:
    X-Up-Target, X-Up-Validate, X-Up-Accept-Layer; up.element.toggle(), up.element.affix(),
    up.element.createFromHTML(); up.util.isPresent(), up.util.pick(), up.util.reject(),
    up.util.uniq().
4X  [up-on-offline]: the compiled callback's argument is named `event` (bug fix: use the
    event callback kind instead of ERROR_CALLBACK in render_options.js); add a spec; fix
    the table in pages/params/up-follow/lifecycle-hooks.md. NO unpoly-migrate polyfill.
5B+ Cache expire/evict: the default expiry/eviction happens when a non-GET request is SENT
    (moved in 3.x). Fix the docs, not the code. Audit every place (up.request/up.render/
    link+form options expireCache/evictCache, up.network.config, X-Up-Expire-Cache /
    X-Up-Evict-Cache, caching.md, server-protocol page) for consistent wording; drop the
    "override with false" promise; report code bugs instead of fixing them.
6A  The orchestrator owns the :4567 preview.
Pre-ship additions: URL prefix move (/api/…, /learn/…) last; Unpoly::Guide → Unpoly::Site
rename; release sync; persona review.

## Applied (2026-10-09)
1A+2A: 74ef1f2d3..cdc5ede17. 3X: 03c55452e (+ site bcba1a1b). 4X: b239b6e1a (spec in link_follow_fn_spec.js). 5B+: 4f7a5a5ad (default expiry at send time since 3.11.0).
Suspected code issues for Henning: (1) clicking [up-follow] offline leaves an unhandled up.Offline rejection (isCritical treats up.Offline as critical); (2) expireCacheFromXHR skips parseModifyCacheValue, so "X-Up-Expire-Cache: false" becomes pattern 'false' (harmless, inconsistent).
unpoly-rails README: line 374 "after every non-GET request" timing; line 393 stray expire sentence in evict section.
