# Wave 2 writer reports (condensed)

## History (5ad096ef1..b0ee6a47c)
Overview 462 words, no "Also in this topic" (all pages above threshold). Fixed old partial-updates list bugs.
Verified-from-code claims to eyeball: explicit [up-location] string updates history after non-GET; up.history.config.enabled=false only stops pushState (title/meta/lang still update); up.history.push/replace don't touch title/meta; restoration renders error responses (fail:false).
Reference bugs: history.js:36 config.enabled doc says "never change history" but only skips URL push. up:location:changed has no learn-ref (sweep). [up-back] no-previous-URL case undocumented.
Open: plan.md rename analytics → tracking-page-views not done (brief forbade renames).
Learn-ref added: [up-back] → restoring-history.

## Forms batch 2: see wave1-notes.md (reviewed with wave 1 critic? NO — wave-1 critic scope included all 10 Forms pages)

## Overlays b1 (e84ea825a..adb784e9f) + layer-terminology folded (f41ec6598)
Unverified: up.validate('select',{params:{company}}) may send company twice; unpoly-rails up.layer.accept helper claim.
Ref bugs: up.layer.open acceptLocation links #event-condition (should be #location-condition); up.layer.config empty "### Configuration inheritance"; [up-dismiss] "On buttons on links".

## Animation (ea5455e5f, 37e11c25b) — 4 pages kept; plan says ONE page (asked Henning A merge / B keep)
Ref bugs: motion.js up.animate/up.morph duration default says 300, real 175; up.morph "Implementation details" contradicts code; module doc links /up.morph#named-transitions; customizing-overlays.md:176 "animatios".
Unverified: cubic-bezier strings via element.animate easing.

## Scrolling & focus (cd8cb6788, cc779c668, 26f01ce6c)
Fixed: focus.md 'reset' not a strategy. Learn-refs added in viewport.js.
Double-check: [up-scroll=hash] aligns top; overview "default stylesheet removes outline from .up-focus-hidden" (only :focus-visible).
Ref bugs: up.focus string param throws; revealMax fn receives element not rects; up.reload focus param copy of scroll; saveScroll/saveFocus "before navigating" vs every render; saveFocus says restoreScroll; config.autoScroll doc vs 'layer-if-main'.

## Network & caching (b9fbcdb6a..652f4e9e2)
Corrected: {abort:false} render does not abort replaced elements' requests.
IMPLEMENTATION BUG (for Henning): [up-on-offline] compiled with argNames ['error'] (render_options.js:111) but receives the up:fragment:offline event (from_url.js:93); lifecycle-hooks.md table wrong; no spec. Fix: EVENT_CALLBACK.
Ref bug: fragment.js:209 autoRevalidate says up.fragment.config.expireAge → up.network.config.cacheExpireAge.
Learn-ref sweep: up:network:late/recover → progress-bar#custom-implementation.
Unverified: "pending validations dropped when fragment aborted"; caching-after-redirects bullets.
Vary tables: Backend writer told to move them (caching.md → optimizing-responses).

## Overlays b2 (8bd21c46c..fd8d75b5d)
Title change: layer-option → "Targeting other layers". Fixed: nonexistent <up-popup-box>; history-in-overlays location claim; up.layer.configure typo.
Unverified: Ruby up.context examples; history Back/Forward full-page claim.
Ref bugs: layer.js ~1350 up.layer.get('parent or root') → 'parent, root'; layer default described as list 'origin, current'; layer.sass stray & in up-popup[size=grow/full] (size=full never 100%).

## Wave 2 critic (5866e00b4..5ff3311b6): all 25 READY. Build: 1 failure (script.js:1000 anchor) already fixed b6fec9c36. URLs 78/78.
Judgment calls (lean): 1 merge Animation (merge); 2 animation "Defining your own effects" no read-more (accept/merge settles); 3 animation "layout does not jump" (soften); 4 up.motion 3 learn-refs (sweep); 5 network/customizing-overlays blurbs enumerate (keep); 6 network+caching "never stale" overclaim (soften "quickly replaced"); 7 overlays root layer used before defined (move stack paragraph up); 8 closing-overlays discarded-response H3s early (move to late H2, keep anchors); 9 scrolling.md:303/focus.md:204 bold "either" (drop); 10 scrolling-and-focus omits [autofocus] (keep); 11 network-issues substituting-content sketch ignores layer (accept); 12 history-in-overlays emoji table (keep unless banned); 13 history overview repeats examples (keep); 14 subinteractions generic "Example" heading (keep).
New ref bugs: [up-back] fallback undocumented; abortable:false docs vs up.fragment.abort.
