# Advanced rendering chapter sitting + content-phase decisions (2026-10-16)

Chapter (full read per R1):
- /advanced-rendering: navigation described as a preset of render options (caching fix); edge-case sentence in failed responses dropped; new "Keeping elements" section.
- /attributes-and-options: repeated precedence kept (#options is the landing spot for reference links). Later (item 4): "One option, three places {#places}".
- /navigation-defaults: intro caching fix; origin example changes { scroll } for tab links.
- /targeting-fragments: unchanged (C19 left as short form).
- /target-derivation: opinion replaced by the risk of disabling verification.
- /failed-responses → /error-responses "Handling error responses" (scope: a response arrived with an error status); aborted/unexpected/network sections moved to their owners without duplication; stays in Advanced rendering.
- /preserving-elements → /keeping-elements.
- /providing-html: unchanged. /render-lifecycle: current terms; error listener moved out of try.

Content-phase decision list (slow-down, 2026-10-16):
1 restore two conflicted files (stray stash) · 2 captions verified against code+specs (render lifecycle: 15 fixes; compiler caption correct) · 4 "layers" → "Every attribute has a JavaScript counterpart" (/start/api) + "One option, three places" · 5 "main fragment" (element) / "main target" (selectors) · 6 learn-ref sweep now · 7 onFailFinished fixed (code+spec+changelog) · 8 RenderResult#none lists all-kept case · 9/12 learn-refs by a symbol's wider topic (rule rewritten in documentation.md; 0 symbols without a ref) · 10 dropped (anchor existed) · 11 failed revalidation calls onFailRendered+onFailFinished, documented · 13 /submitting-forms#autosubmit section, separated from [up-validate].
Also: figures with visually hidden figcaptions for all media; anchor shims removed (rule: paths get redirects, anchors don't); var → let in all examples; Motion chapter; /background-requests; cacheEnabled.
Content phase closed except agent tasks on the pre-launch list (code check, prose-sweep fixes).
