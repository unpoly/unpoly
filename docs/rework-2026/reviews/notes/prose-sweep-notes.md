# Prose sweep notes

## Scan results (automated)
- Stock AI words: almost none. data.md:52 "more powerful alternative"; placeholders.md:137 "appear seamless". Em dashes: none in prose (only tables/cites). Rhetorical questions: none.
- "not X but Y": none found by regex.
- TERM: "failed response" still used ~35x in pages+JS after rename to /error-responses: optimizing-responses.md:69,108; transitions.md:76,78; advanced-rendering.md:89,100; validation.md:106,117,129; server-protocol.md:34; targeting-other-layers.md:195,202; render-lifecycle.md:272-273; polling.md:134; params/up-follow/request.md:28; params/up.render/request.md:61; params/*/scrolling.md, focus.md, targeting.md:13; network.js:59,429; protocol.js:78; form.js:360,1556. "failed request" for network issues (network-issues.md:5,24; fragment.js:824,860; network.js:932; protocol.js:163) - different concept (no response).
- TERM: "in the background" loosely for normal requests: start/overview.md:18, start/links.md:17, start/forms.md:21 ("sends the form data in the background"), navigation-defaults.md:20 (polling; ok-ish). Also "layer in the background" = parent layer (targeting-other-layers.md:103,113; layer.js:1339; base.js:375) - different sense of same phrase.
- TERM: "preserved" chip in keeping-elements.md:44; "Preserve elements within a fragment" render-lifecycle.md:36; polling.md:183 "To preserve individual elements"; islands.md:107 "To preserve an island"; params client-state.md "[up-keep] elements will be preserved".
- "document nonce": none found. Good.

## Learn pages read: start/*, install, links chapter, forms chapter, overlays.md, partials
- TERM (B, high): start/api.md:10-13,34 "One feature, three layers"/"The quickest layer is an attribute" — "layer" is reserved for Unpoly layers (root/overlays). Confusing on an API-shape page. Suggest "three forms"/"three levels".
- TERM (B): "in the background" for ordinary requests: start/overview.md:18, start/links.md:17, start/forms.md:21.
- TERM (B): overlay vs dialog vs box: overlays.md:19-21 ("shows it in a modal dialog. The user can dismiss the dialog... clicking outside the box"), start/overlays.md:4,19,22-23 ("like a modal dialog", "clicking outside the dialog"), start/overview.md:67 "modal overlay".
- TERM (B): "failed" family in validation.md: 70 "Signaling a failed submission", 97 "failure detection", 106/129 chip "Failed responses will appear here", 117 "render a failed response", vs 134 "rendering error responses differently". submitting-forms.md:71 "detect a failed submission".
- TERM (B?): navigation default scroll described differently: following-links.md:59 "the page scrolls to the top" vs submitting-forms.md:93 "the new content is scrolled into view". start/overview.md:52 "The page scrolls to the top". Check navigation-defaults.md to see which is right.
- TERM (B, minor): "effects" for [up-switch]: switching-form-state.md:7,8,11,12,208,212-214; forms.md:102 "Light effects". "effect" also used for motion.
- TERM (minor): handling-all-links.md:47 "accelerated links" for instant links (one-off term).
- A: custom-form-fields.md has the most AI rhythm: :16 "If you can keep a native field in the form, do."; :24 "The user sees the control; the form submits the field."; :54 "Don't forget the `change` event."; :100 "for free"; :166-169 "affects what Unpoly **sends**, not what it **watches**... Use it for data that is derived, not edited." (not-X-but-Y + closer).
- A (minor): start/overview.md:71-72 "Every move works on its own, so you can stop at any point and already have a better app." sales-y closer. reactive-server-forms.md:137-138 "however fast the user is and however slow the network" flourish.
- C: watch-options.md:18-20 three-sentence paragraph about which options apply to which feature, before any example; "An [up-watch] callback must forward its options to the function that renders" assumes knowledge of up.watch callback signature.
- C (minor): preloading.md:103 'Preloading will not change elements ("render").'

## Read: overlays chapter, loading state, live fragments, history, scrolling
- C (high): submitting-forms.md:93 says navigation default is "the new content is scrolled into view", but scrolling.md:13-17 and following-links.md:59 say main-target updates scroll to top; minor targets don't scroll. Prose contradicts behavior.
- TERM (B): "main target" vs "main element" vs "main content": scrolling.md:14 "main target" / :105 "main element" / :226 "main target" / :233 "main element"; focus.md:19 "main target ... focus the main element"; opening-overlays.md:115,168 "main target"; history.md:5 "main content" vs :12 "main element"; updating-history.md:4 "main content" vs :14 "main element"; start/overview.md:48 "main content". /main is the page.
- TERM (B): "reveal" misuse: history-in-overlays.md:50 "This reveals the location of significant content to the user".
- TERM (B): "failed GET request" for an error response: updating-history.md:98. polling.md:134 "Handling failed responses" heading. targeting-other-layers.md:195,202.
- TERM (B): "effect" for non-motion: loading-state.md:6 "Every effect", placeholders.md:45 "preview effects", previews.md:122 "preview effect", switching-form-state (switching effects).
- TERM (B, minor): overlay dismiss area: "backdrop" (overlays.md:73), "background" (closing-overlays.md:19,68; customizing-overlays.md:166,177), "outside the box"/"outside the overlay box" (overlays.md:21, customizing-overlays.md:161), "outside the dialog" (start/overlays.md:23).
- C: tracking-page-views.md:62-64 "This emits up:location:changed and counts another view of the parent page. The `up:layer:location:changed` listener below does not." Forward reference; unclear what "does not" refers to.
- C (minor): targeting-other-layers.md:102-107 dense paragraph about up.layer.current in compilers.
- C (minor): live-fragments.md:70-71 "The link swaps itself with a link to the page after that." OK but terse.
- A: none notable in these chapters. Prose is plain.

## Read: network, motion, scripting, backend, advanced rendering, extensions, formats, params
- TERM (B, high): attributes-and-options.md:13 heading "One feature, three layers {#layers}" + :40 "Each layer only replaces the values it actually sets" + start/api.md:10,13,34. "layer" reserved.
- TERM (B): main content/element/target within single pages: navigation-defaults.md:5 "main content" / :47 "main target" / :56 "main element"; advanced-rendering.md:64 "main content"; error-responses.md:73 "main target" / :75 "main content area"; targeting-fragments.md:41 "main element" vs :289-300 "main target"; history.md:5/12; updating-history.md:4/14; start/overview.md:48. Counts: "main element" 71, "main target" 52, "main content" 9.
- TERM (B): "failed response" 25 vs "error response" 39. advanced-rendering.md:85-101 section titled "Handling error responses" then uses "failed form submission", "failed responses", "A failed response". params/*: up-follow/request.md:28, targeting.md:13, scrolling.md:9, focus.md:9, up.render/request.md:61,63 ("considered failed"), scrolling.md:12, focus.md:9. server-protocol.md:34. render-lifecycle.md:272. transitions.md:76-78. optimizing-responses.md:69,108. polling.md:134.
- TERM (B, minor): "effect" senses: motion umbrella (motion.md:9 "two kinds of effects", controlling-motion throughout) vs switching effects (switching-form-state) vs preview effects (loading-state.md:6, placeholders.md:45, previews.md:122) vs compiler side effects (enhancing-elements.md:112-131 "Element-local effects", "Global effects").
- TERM (B, low): "render pass" (137) vs "fragment update" (68) used interchangeably, e.g. render-lifecycle.md:268 "Fragment update was aborted" in a table otherwise about render passes; up.render/navigation.md:4 "this fragment update".
- C: params/up-follow/focus.md:25 "Saved scroll positions can later be restored with [up-focus=restore]" — should be focus state (copy-paste from scrolling.md). Misleading.
- C: params/up-follow/loading-state.md:16-17 "the placeholder will be shown temporary overlay" (missing words).
- C: url-patterns.md:120 "JavaScript functions that URL patterns will accept multiple patterns" (garbled, missing verb). Page is older style: :6 "Please note that regular expressions ("regexes") are not supported. You must use the expression system described on this page."
- C: relaxed-json.md:32 heading "Postel's law" doesn't describe its section (Unpoly outputs strict JSON).
- C: conditional-requests.md:178 "a error response".
- C: params/up-follow/lifecycle-hooks.md:6 & up.render/lifecycle-hooks.md:6: [up-confirm] "shown as a native browser prompt" linking to Window/prompt; implementation uses confirm().
- A: backend-integration.md:32-33 "A server that ignores them gets a working app. A server that reads them can do less work" (parallel pair; mild). extensions.md:4 "no server library, no build step, no CSS framework" (triad; mild). templates.md:94 "very low-tech way"; :147 "countless template engines".
- A (pattern): "X. Y does the same with less typing." navigation-defaults.md:92 — fine.
- Overall: Learn prose is clean of slop; the main issues are terminology drift and a handful of factual/copy errors.
