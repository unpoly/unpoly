# Sitting packet: Loading state chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: C2 (optimistic previews drop `form.reset()`), A10-A16, B1, B2 (fix round, 146b56aca).
No deferred duplication items (C/B) touch this chapter.

| Page | Pointers |
|------|----------|
| loading-state | 0 |
| feedback-classes | 1 |
| placeholders | 0 |
| previews | 0 |
| optimistic-rendering | 2 |
| progress-bar | 0 |


## Loading state (`/loading-state`, 127 lines)

Chapter overview: feedback classes, placeholders, previews, optimistic rendering; progress bar and offline in "Also in this topic".

**Changed since writing**
- 146b56aca (B1): disabling joins the family, in the intro ("disabled form fields") and in the previews
  sentence ("Feedback classes, placeholders and [disabling](/disabling-forms) are *previews*").

No pointers. (Checked: the teasers show the whole family, with disabling in "Styling loading elements" and the
previews sentence. The previews teaser repeats the `link-spinner` example of previews#basic-mutations, but it adds
its own angle ("This holds for any outcome…"), same case as the overlays teaser you left in the Overlays sitting.
The optimistic teaser uses its own variant (`preview.insert('#tasks', task)`), not the detail page's.)


## Feedback classes (`/feedback-classes`, 218 lines)

`.up-active` / `.up-loading` for links and forms, styling, active fields, removal, revalidation, JS origin, custom classes, opting out.

**Changed since writing**
- 146b56aca (A10): the `[up-validate]` bullet is gone from "Fields can be active origins" (a validation's origin is the form).
- 146b56aca (A11): new first sentence in "Feedback during cache revalidation" (no classes for content rendered from the cache).
- dfa0712e0 (Q1, code): validations now set feedback classes by default. Nothing on this page said otherwise.

### 1. The new cache sentence and the old "Note that" sentence say the same thing

> When content is rendered from the [cache](/caching), no `.up-active` or `.up-loading` classes are set, since there is nothing to wait for.
>
> When rendering content from a stale [cache](/caching) entry,
> Unpoly [automatically reloads the fragment](/caching#revalidation) to ensure that the user never sees expired content.
>
> During this cache revalidation Unpoly marks the targeted fragment as `.up-revalidating`:
>
> (example)
>
> Note that the `.up-loading` and `.up-active` classes are *not* set during cache revalidation.

(feedback-classes.md:143-156)

The fix round put A11 in front of the old text. Now the section says "no `.up-active` or `.up-loading`" twice, six
lines apart, and links `/caching` twice. Both statements are correct: a cache hit runs no previews (request.js:611),
and a revalidation sets only the revalidating classes (status.js:416-420). One sentence can say both. (Pattern 5)

- **A.** Merge: keep the cache-hit sentence, drop the "Note that" line, and say "instead of `.up-loading`" where `.up-revalidating` is introduced.
- **B.** Leave both.

**Lean: A (strong).** Draft for feedback-classes.md:143-156:

```md
When content is rendered from the [cache](/caching), no `.up-active` or `.up-loading` classes are set, since there is nothing to wait for.

When the cache entry is stale, Unpoly [automatically reloads the fragment](/caching#revalidation)
to ensure that the user never sees expired content.
During this cache revalidation Unpoly marks the targeted fragment as `.up-revalidating` instead of `.up-loading`:

```html
<div id="target" class="up-revalidating"> <!-- mark: class="up-revalidating" -->
  Possibly stale content
</div>
```
```


## Placeholders (`/placeholders`, 168 lines)

`[up-placeholder]` HTML, templates with variables, placeholders for new overlays, and `preview.showPlaceholder()` for everything else.

**Changed since writing**
- 146b56aca (A12): "Placeholders are not shown when content is rendered from the cache", linking previews#using-previews-with-caching (placeholders.md:50).

No pointers. (Checked: the placeholder goes into the first targeted fragment, status.js:272-274; for a new
overlay the temporary overlay closes without animation and the real one opens without animation,
classes/preview.js:777-781; dismissing it aborts the request, classes/preview.js:862-865.)


## Previews (`/previews`, 343 lines)

`up.preview()`, the `up.Preview` mutators, context getters, how previews end, parameters, multiple previews, manual mutations, caching, delaying.

**Changed since writing**
- 146b56aca (B1): disabling joins "built on previews" (previews.md:9-10).
- 146b56aca (A13): focus taken by a preview is restored unless the user moved it (previews.md:110-111).
- 146b56aca (A14, reference): the `up.Preview#hideContent` example now calls `hideContent()`, not the nonexistent `hideChildren()`.

No pointers. (Checked: named previews get `{}` as options when none are given, so `{ size = 50 }` works,
classes/preview.js:316; `[up-revalidate-preview=true]` reuses `[up-preview]`, from_response.js:118-123.
Two reference typos in the same file are under "Clear fixes".)


## Optimistic rendering (`/optimistic-rendering`, 178 lines)

Use cases, the TODO-list example with `preview.params`, validation errors, templates against view duplication, the demo app.

**Changed since writing**
- 146b56aca (C2): `form.reset()` removed from both previews.
- 146b56aca (B2): the template example lost its `if (text)` guard.
- 146b56aca (A15): "When the user submits again before the server responds, the new submission aborts the
  earlier request and reverts its preview." (optimistic-rendering.md:76-77)

### 1. "Recent feature, expect more changes" no longer matches the API

> > [note]
> > Optimistic rendering is a recent feature in Unpoly, and is inherently difficult in a server-driven approach.
> > Expect more changes as we're looking for the best patterns.

(optimistic-rendering.md:13-15)

Optimistic rendering shipped in 3.10 (docs/changes/CHANGELOG_3.x.md:1419-1422), four minor versions ago.
Everything the page uses is `@stable`: `up.preview()` (status.js:110), `up.Preview#params` (classes/preview.js:148),
`up.template.clone()` (fragment.js:3007). "Expect more changes" reads like a stability warning
that the API docs don't give. The first half ("inherently difficult") is still useful advice.

- **A.** Delete the note. "Suitable use cases" already says when the extra effort pays off.
- **B.** Keep the caution, drop the "recent / expect changes" part.
- **C.** Leave it.

**Lean: A (medium).** Draft for B, if you prefer it (optimistic-rendering.md:13-15):

```md
> [note]
> Optimistic rendering is inherently difficult in a server-driven approach.
> Use it where the effect matters most, see [suitable use cases](#use-cases).
```

### 2. The `[required]` example repeats the form from the top of the page

> For example, the form above uses the `[required]` attribute to block form submission until
> the task text has been filled in:
>
> ```html
> <form up-target="#tasks" up-preview="add-task">
>   <input type="text" name="text" required> <!-- mark: required -->
>   <button type="submit">Save</button>
> </form>
> ```

(optimistic-rendering.md:89-97)

> ```html
>   <form up-target="#tasks" up-preview="add-task"> <!-- mark: up-preview="add-task" -->
>     <input type="text" name="text" required>
>     <button type="submit">Save</button>
>   </form>
> ```

(optimistic-rendering.md:45-48)

The sentence says "the form above", then shows the same three lines again. The only new thing is the mark on
`required`. (Pattern 5)

- **A.** Keep the sentence, drop the code block.
- **B.** Leave it, the mark draws the eye.

**Lean: A (medium).** Draft for optimistic-rendering.md:89-97:

```md
For example, the form above uses the `[required]` attribute to block form submission until
the task text has been filled in.
```


## Progress bar (`/progress-bar`, 103 lines)

When the bar appears, styling, timing, background requests, disabling, a custom indicator from `up:network:late` / `up:network:recover`.

**Changed since writing**
- 146b56aca (A16): cache revalidation joins the background list, and "[Deferred content](/lazy-loading) loads in
  the foreground unless you set `[up-background]`" (progress-bar.md:52-54).

No pointers. (Checked: 400 ms default, network.js:140; 3 px blue bar, network.sass; `{ lateDelay: false }`
and background requests never become late, classes/request.js:403-412; `config.progressBar`, network.js:145.)


## Clear fixes (apply without asking)

Reference doc comments in `src/unpoly/classes/preview.js`, found while checking the Previews page:

1. classes/preview.js:852, the `up.Preview#openLayer` example calls a method that doesn't exist
   (no `openOverlay` anywhere in src/, the method is `openLayer()` at :859):
   `preview.openOverlay('Please wait...')` → `preview.openLayer('Please wait...')`
2. classes/preview.js:788, `up.Preview#swapContent`: "achieved by [hidden existing children]" → "achieved by [hiding existing children]".
3. classes/preview.js:790, same comment: "all changes will ber reverted" → "all changes will be reverted".
