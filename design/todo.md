Partial
=======

- New cache
  - In an offline case, the revalidation request is killing our existing cache entry (which may be expired but does have a response)
  - Maybe get() needs a purpose?
  - Maybe keep entries with a response until we have a better response
- Request merging
  - BLOCKER: Merged requests can no longer match with Vary 
  - Document with up.request() and X-Up-Target
  - Test that the request is aborted when either fragment is aborted
  - Test merging of two multi-fragment requests
- [up-preload]
  - Do a preloading doc page
  - Document [up-load-on] for [up-preload]
    - Both modifier param and prose.
- [up-partial]
    - Docs
      - Consider a doc page "Lazy loading content"
      - Note caching benefits like Turbo frames does: https://turbo.hotwired.dev/handbook/frames#cache-benefits-to-loading-frames
      - For [up-partial]
        - Note that all attributes for [up-follow] can be used
        - Document the render options for which we set a default
      - For up:partial:load
      - For up.partial.load()
        - Second options arg supports all render options 
        - Document the render options for which we set a default
      - Support without JS important? 
      - SEO
        - Use link to be indexed
        - Use div to not be indexed
      - Targets for the same URL are merged



Ideas for cache misses after request merging
--------------------------------------------

### Delete request merging

- It's less code!

### Accept the cache misses

- This would only affect the rare case where requests would (1) respond with Vary and (2) sometimes be merged, sometimes not
- The situation *before* the merging logic was not without flaws either.
  - We would attach to the previous request, but lie to the server about what targets we're requesting
    - If the server responds with the wrong optimization, we will make another request
  - Requests were not aborted if the wrong fragment was targeted

### Make a toggle

- `up.network.config.mergeRequestTargets`


### Rework the cache

- Make a bucket of cache entries for each method/URL
- When looking for a hit, get all matches and pick the most recent one
- Evicting/expiring a request will evict/expire the entire bucket (all requests for this method/GET)
- When would we override a bucket entry?
  - A hard limit?
  - Combination of all influencing headers? => Yes. Change up.Request.Tester so, with a Request argument, it compares descriptions



Priority
========



Backlog
=======

- In an offline case, the revalidation request is killing our existing cache entry (which may be expired but does have a response)
- Add a config to disable validate merging
- Docs for up:link:follow should note that, when mutating render options, it's a good idea to also mutate in up:link:preload
- Docs for up:fragment:loaded should not in params that renderOptions may be mutated
- Allow "true" and "false" values for all attributes
  - Check if we can offer more exclusion selectors
    - noNavSelectors, [up-nav=false]
    - [up-expand=false]
- up.history.config.restoreTargets has weird default documented: config.restoreTargets=[]
- Touch events can scroll the background of a drawer overlay on https://unpoly.com/
- Maybe [up-clickable] should set a `button` role by default
  - But keep a `link` role on `a:not([href])` elements, to match `<a up-content>`  
- In a multi-step render pass, let compilers see all updated fragments
  - This would require us to delay compilation until all fragments are inserted 
- Consider whether Request#target, Request#context etc. should be setters that auto-set the corresponding header.
  - Would save code in mergeIfUnsent()
  - Would save code in setAutoHeaders()
  - We could also make #headers or #header() hallucinate new headers
    - Maybe hard since we allow write access headers[key] = value
      - Would be easier with header() and setHeader()
      - Still need to iterate over the whole thing for passing over headers to xhr

- Consider an up:fragment:render event to modify renderOptions for all kind of passes
  - We have so many guardEvents now
  - Test that we can still modify event.renderOptions
  - Possibly offer originalEvent or something?
    - No! We would need to check their renderOptions for mutation. Who is interested in other events can use them.
  - Update docs: Render Flowchart
  - Update docs: Manipulate render options
- Docs: https://unpoly.com/X-Up-Method signal that a change of HTTP method happened
- Docs: https://unpoly.com/closing-overlays#closing-by-targeting-the-parent-layer should mention that targeting a layer *dismisses* with a `:peel` value (#598) 
- { dismissLabel } should be able to contain HTML
  - Maybe rename to { dismissContent } or something?
- Allow variations of official layer modes
- lightbox Layer mode
  - Where are we going to put the margin around the box, if we're not having a viewport? 
- Move custom spec helpers out of `jasmine.foo()` to `specs.foo()`
- Allow to keep elements *without* remembering to mark elements as [up-keep]
  - config.keepSelectors
  - Allow { useKeep: '[up-keep], .search-input' } to keep additional elements
  - Elements can still opt out with [up-keep=false]
- Unpoly Rails needs to ignore pseudo-elements
- I think we can replace up.Rect.fromElement() with just element.getBoundingClientRect() 
- I think revalidation now loses :maybe marks. We should have more tests.
  - Case 1 => I think this is implemented
    - We're loading ".foo, .bar:maybe"
    - Server only renders ".foo"
    - Revalidation should just be for ".foo", or for ".foo, .bar:maybe"
    - It should be OK if revalidation response only contains ".foo"
  - Case 3 => I could live without this.
    => Or should we allow reavalidation with defaultMaybe: true ?
    - We're loading ".foo, .bar:maybe"
    - Server renders ".foo, .bar"
    - Revalidation should just be for ".foo", or for ".foo, .bar:maybe"
    - It should be OK if revalidation response only contains ".foo"
  - Case 2 => I think this is implemented
    - We're loading ".foo, .bar:maybe"
    - Server renders ".foo, .bar"
    - While we're loading .bar was removed from the page
    - Revalidation should just be for ".foo", or for ".foo, .bar:maybe"
    - It should be OK if revalidation response only contains ".foo"
- Preserve text selection ranges when reloading / polling / revalidating
- Don't use the default duration for animations and transitions with { duration: 0 }
- Should [up-poll] and up.reload() render failed responses if they match the target?
  - At least for reloading the element may actually have entered the DOM from a failed response
- Site: Scrollbar styling https://makandracards.com/makandra/617528-chrome-121+-no-longer-supports-non-standard-scrollbar-styling
- Per-link animation options for new layers
  - Support mutatable animation options for up:layer:dismiss, up:layer:accept
  - Parse [up-close-animation] for links that open a new layer
  - Parse [up-open-animation] as an alias for [up-animation]
- The log message "Could not match primary target" should not appear when we're only working with fallback targets, and we happen to use the second one. E.g. first one is [up-main=modal], second one is [up-main].
- [up-partial]
  - Merge the X-Up-Target when attaching to an existing request
  - Default to its own URL?
  - Should it get a header?
    - Users can also do [up-headers] on the link
- Print a warning when we can find no better form group than the <form> itself
- Run macros (but not compilers) *before* history changes
- Give layers an [index] attribute so users don't style based on [nesting]
  - Do we give root an [index] as well?
    - We cannot use [index] here
    - [up-layer-index] would maybe a good default
- Docs should show DOM structure of all layer modes
- Simplify animation API implementation with Element.animate()
  - Animation finishing could be implemented with Element#getAnimations()
  - This should also fix a regression for: Animations that fly in an element from the screen edge (move-from-top, move-from-left, etc.) no longer leave a transform style on the animated element. By @triskweline.
- Don't allow a request payload for DELETE requests
  - Maybe make this configuratable as opinions vary here.
    - e.g. up.network.config.payloadMethods
  - Is this really important?
- Consider parsing scroll-margin-top, scroll-margin-bottom for revealing
- Allow [up-emit] for buttons
- Docs: Mention that [up-href], [up-alias] cannot be set by a macro
  - Or run macros before updating history
- Docs: Explain how to convert JSON responses to HTML responses (discussion #562)
- Convert .sass files to .scss
- While morphing or destroying, disable pointer events on old element
- Support { onLoaded }, [up-on-loaded] for polling fragments
  - Test: Can be used to skip() a polling response, polling then continues
  - Test: Can be used to preventDefault() a polling response, polling then continues
- [up-disable] should disable links (discussion #561)
  - Within the form
  - As a stand-alone link
  - How to mark disabled links? .up-disabled ? Just [disabled]?
  - CSS: { cursor: not-allowed }
  - Also [aria-disabled=true]
  - Prevent with JS? pointer-events?
    - Also prevent keyboard focus with temporary [tabindex=-1]
  - Bootstrap already has a.disabled and users would like to take over that styling
- Docs: Copy important up.render() options to up.layer.open() and a[up-layer=new]
  - In particular { content, fragment, url, document }
- Look within :origin first
  - Remove similiar logic in up.FragmentProcessor: findSelector()
- Remove [up-validate] from individual fields https://unpoly.com/up-validate#validating-multiple-fields
- Support nonce rewriting for arbitrary attributes, e.g. up.safe_callback('124321321', '432423423')
  - But then we would need to know all the attributes we're rewriting to query them quickly
    - Or find them with XPath
  - OR we could support [up-on] with an event name and a nonce
- Swapped body looks funny in Safari (has .up-destroying class and is grayed out with old content in inspector)
- Allow to disable batching in validations
- inlineStyle, setInlineStyle should work with custom properties
- Jasmine matchers no longer get a `customEqualityTesters` argument
- up.ResponseDoc: Only re-discover the origin when match is 'region'
- Async compiler functions
  - See separate doc
  - Don't need to delay this until V4 as destructors no longer throw
- Is the [up-keep=false] pattern good to keep?
  - E.g. for flashes: We could interrupt a keep chain this way, but then the element can never again be keepable
  => It's the same for polling
- consider having dev builds with debug terser
- Docs: /accessibility page
  - But where does it go?
  - Top-level?
- 2024: Replace up.error.emitGlobal() with window.reportError()
- Publish up.util.sprintf()
  - But rename it to something else, as sprintf() is something else
- Docs: Custom input elements
  - Have your custom element expose `{ name }` and { value }` properties (AFAIK Shoelance components already do)
  - Also `{ disable }`
  - Make Unpoly aware of custom elements by pushing a selector to [`up.form.config.fieldSelectors`](https://unpoly.com/up.form.config#config.fieldSelectors).
  - Make Unpoly aware of custom submitt buttons by pushing a selector to [`up.form.config.submitButtonSelectors`](https://unpoly.com/up.form.config#config.submitButtonSelectors).
  - Limitation: One value per field. Checks for groups (.checked and .selected) are still hard-coded
- Test that system compilers always run before user compilers
  => We already have macros if compilers need to use others?
- Concepts [up-feedback] and [up-background] are overlapping
  - Should feedback: false imply background: true ?
  - Should we generalize the feedback option?
    - { feedback: ['classes', 'progress', 'custom'] }
      - But I always want classes?
- Message when unknown target: Revalidating cached response for target "undefined"
- Extend [up-switch] with [up-disable-for="..."] [up-enable-for="..."]
  - This is really confusing with [up-disable]
  - Or should we have an [up-switch-for] and [up-switch-effect]?
- up:feedback:start / up:feedback:stop
  - On the layer, not an individual element
  - Needs to have reference to origin and targetElements
    - Must be the same element in :start / :stop, even if the DOM has changed in between
  => With .up-validating we have different points where feedback starts and ends.
    - This class does not exist. It was an idea detailled further down.
  => Or we could have a single up:feedback event with a promise for the duration
- Do we want a preventable up:request:reuse event?
  - Maybe even :reused since there is no :loaded for cached requests
- Experiment with property mangling vs. public API
  - Possibly do a unpoly.experimental-min.js ?
  - If we could test a minified version we could publish this
    - Do we really think about this when publishing?
    - This would need to be part of the regular build
- Issue with splitting Immediate-Child-Selectors: https://makandra.slack.com/archives/C02KGPZDE/p1659097196752189
- Can we get rid of the afterMeasure() callback?
- Support { scroll: 'keep' }
  - Similiar to { focus: 'keep' }
  - Store scrollTops around a viewport in UpdateLayer
  - Possibly refactor tops to up.ScrollTopsCapsule
- Check that the target (and all non-successful target attempts) are visible in the log
  - Possibly highlight
- Do we want to support ` or ` in targets?
  - Is there any case other than [up-target], where we already have [up-fallback] ?
- Should animations force painting?
  - I don't understand how the transitions work when we set both the first and final frame in the same JavaScript task
- Maybe auto-submit should not navigate by default
  - How to restore this?
  - up-navigate ?
  - up-watch-navigate ?
  - up-autosubmit-navigate ?
  - Is it cool that search results would no longer get a URL update?
- Does [up-back] use the previous layer location?
- There was a case where { origin } should look inside an origin:
    up.render('.day_menu_dish_autocomplete .day_menu_dish_autocomplete--suggestions', {
      origin: titleInput,
      url: '/day_menus/suggestions'
    })
- Expose up.fragment.config.renderOptions
  - Now that we have *some* opinion about the defaults { abort: 'target', focus: 'keep', revalidate: 'auto' }, users may want to deactivate
- Try to have a 'hash' strategy in overlays
  - Also update doc page /focus
- Split JavaScript => Do this after asset reconciliation
- input.setCustomValidity() should block submission
- Replace symlinks in dist/ with copied files
  - Not trivial, see hk/copy-dist-artifacts
- Maybe a way to mark elements as keep before rendering?
  - This would also be up:fragment:loaded
  - Maybe a render option { useKeep: [....] }
    - With additional fragments to keep
    - Could be set both in initial render and in up:fragment:loaded
    - Would not require an [up-keep] on the other side
- Consider keepSelectors and noKeepSelectors
  - Now that [up-keep] no longer has a value?
    - Note that we do have [up-keep] hardcoded in multiple places
- Should we offer a way to manually add etags?
  - E.g. up.on('up:request:loaded', ({ response }) => { response.etag ||= sha1(response.body) })
  - Should this even be a default?
  => People can already set response.headers['ETag'], although that's not documented
- Matching in the region of ancestors should use subtree, not just descendants of the ancestor
  - In a form we should always be able to say form:has(:origin) .descendant, even if the origin turns out to be the form itself
    - But :has() does not work like that?
- [up-on-accepted-reload], { onAcceptedReload }
- [up-on-accepted-validate], { onAcceptedValidate } (aber hier brauche ich immer einen param)
- Consider removing all tagnames from public selectors
  - We already had to remove tag names of multiple-use attrs like [up-watch]
  - current
    - a[up-follow]
    - a[up-instant]
    - a[up-preload]
    - form[up-submit]
    - a[up-accept]
    - a[up-dismiss]
    - a[up-layer=new]
    - a[up-transition]    \__
    - form[up-transition] /
    - a[up-alias]
    - a.up-current
    - a[up-emit]
    - a[up-back]
  - deprecated
    - a[up-close]
    - a[up-drawer]
    - a[up-modal]
    - a[up-popup]
- Can layer objects nullify their { element, tether } once closed?
  => This may cause async JS to throw, if that JS wants to go through the layer shortly after closing
  => How about we do this 10 seconds after { onFinished } or so?
- It may be nice if guardEvents see the change's getPreflightProps().fragments
  - Either lazy with Object.definePropery() *or*, if we find that we're going to call getPreflightProps() anyway, just call it.
  - Can we memoize getPreflightProps() in FromURL ?
- up.validate() always submits to the first submit button
  => Is this a bug or a feature that we use the same behavior as submit would?
- When a layer reaches a close condition, should we still render [up-hungry][up-if-layer=any] elements in another layer?
  - Would be practical for flashes
  - Would be weird for API. Render events flying afterwards, we cannot communicate a RenderResult.
- When opening a new layer, we should update [up-hungry][up-if-layer=any] elements
  => This is not trivial as OpenLayer cannot work with multiple steps yet
  => Maybe we can do a "secret UpdateLayer pass" once the layer has opened.
    - We would need to merge RenderResult objects
- Custom attributes are not copied into [up-expand]
  - up.link.config.expandableAttributes ?
    - can also include regexp
      - maybe reuse matcher logic for badTargetClasses
    - what if you need to copy an individual class, not an attribute?
      - up:link:expanded event for custom handling?
 - up.link.config.expandableAttribute (attribute, element)
    - The element will always be a link
- Support custom expire times via Cache-Control: stale-while-revalidate
  - Print a warning when we're discarding any other Cache-Control header format
- Test and document [up-href]
- Polling should automatically restart when the tab is re-focused
- A validating fragment should get a .up-validating class
  - Group under up.feedback
  - Maybe we can have a private API
    - { feedbackLoadingClass: 'up-validating', feedbackActiveClass: false } ?
    - { feedback: { loading: 'up-validating', active: false } } ?
    - With history we have separate options { title, location }
- Consider renaming up.fragment.config.navigateOptions to just up.fragment.config.navigate
  - There is precedence in up.layer.config.overlay
- Firefox: Focus loss after disable is not always detectable synchronously
  - Force Repaint does not help
  - setTimeout() helps (wait for next render?)
  - We fixed this in up.form.disableWhile(), but it may still be broken for up.fragment.config.autoFocus options suffixed with "-if-lost"
- Consider whether validation requests should be background requests by default
  - We should also have [up-watch-background]
- Why does [up-validate=form] target the first form for some users?
  - https://github.com/unpoly/unpoly/discussions/474


Documentation
=============

- Should we offer a { placement: 'merge' } to merge children?
  - By selector?
  - How would that relate to recursive merging?
  - We don't need it for flashes, [up-on-keep] suffices here
    - [up-on-keep] can already support merging, morphing, etc.
      - However it's impractical to use it for regular fragment updates, you'd want .target:merge or something.

- Example for a custom overlay
  - Example in up:link:follow
  - https://github.com/unpoly/unpoly/discussions/473#discussioncomment-5665806

- Activating custom JavaScript
  - (Currently sitting in up.compiler())

- Rendering from strings
  - { document }
  - { fragment }
  - { content }

- Preloading
  - (Currently sitting in a[up-preload])
  - On Hover
  - Programmatically
    - Example: Preload next/prev

- Polling
  - (Currently sitting in [up-poll])

- Options and defaults
  - Everything is opt-in
  - Navigation enables a set of new defaults
    - Navigation options are the only opinioniated defaults that are opt-out
  - config options
  - auto-options
  - Most options in up.render() can also be set via an attribute
    - JavaScript options override HTML attributes
    - If we cannot serialize an option into an attribute, you can use `event.renderOptions` in up:link:follow, up:form:sumit
  - Explain that you can often override renderOptions in event handlers
    - This is already explained in /render-hooks

- Background requests
  - Background requests deprioritized over foreground requests.
  - Background requests also won't emit up:network:late events and won't trigger the progress bar.
  - Background requests are promoted to the foreground if they are a cache hit for a new, non-background request


Icebox
======

- Allow late registrations of compilers and macros without priority
  => OK for compilers, but what about macros? They have an intrinsic priority (before all compilers)
- Consider whether up.validate() promises should wait until no more solutions are pending
  => We would need to merge RenderResult#target in some meaningful way
- Rename "finished" to "concluded"
- Should up:click set up.layer.current ?
  - It would be more convenient, but it's only relevant for popups or backdrop-less modals. This is rare.
- New onTransitioned() callback to take some load off from onFinished()
- Move scroll positions into state
  - This gets rid of the other up.Cache usage
  - This may mean we need to lose up.viewport.restoreScroll() and { scroll: 'restore' } and { saveScroll: true }
    - Losing { scroll: 'restore' } is super sad :(
  => Maybe revisit when the Navigation API is supported
- Improve polling in the background
  - It would be great to *not* have a timeout running while we're in the background or offline
  - It would be great to not wait up to 10 seconds when we're re-focused or regain connectivity
    - Are timeouts really paused or do they just not fire until re-focus?
    - Mobile Chrome seems to reload old tabs automatically, test this!
- Elemente mit [up-hungry][up-layer=any] müssten wir *eigentlich* auch austauschen, wenn wir einen neuen Layer öffnen
  - OpenLayer kann aber gar nicht mit mehreren Steps umgehen
- can badResponseTime be a function that takes a request?
  => Yes, but not trivially
- Consider using `Cache-Control: stale-while-revalidate=<seconds>` to indicate how long we can use a response
  - But it could be paired like this: Cache-Control: max-age=1, stale-while-revalidate=59
  - But then again we ignore Cache-Control for all other purposes
    - E.g. Cache-Control: no-store
    - E.g. Cache-Control: max-age
    - How would Cache-Control: no-cache (equivalent of max-age=0 must-revalidate) work in connection with up.fragment.config.autoRevalidate ?
  - Maybe do a bigger workover of Cache-Control?
- Do follow links with [target=_self]
- up:click forking could print a warning when an a[href] is instant, but not followable
- Is it weird that up.layer.affix appends to the first swappable element instead of the contentElement?
  - It's actually more like "appendableElement"
  - Maybe offer up.Layer#append
- Consider exposing up.layer.contentElement
- Do we want a shortcut macro for this:
      <input up-validate up-keep up-watch-event="input">
  - <input up-live-validate>
  - It's weird for users who don't target the input. They may expect to just override the event.
  - We would need to make keepable selectors configurable to include this one
- We could support this with more pseudo-class selectors like :form-group and :submit-button
  - :submit-button is hard to build origin-aware => It could just be a substitution with :is() / :-moz-any() & :-webkit-any()
  - :form-group is also supper hard to support in a selector like ".foo, :form-group, :bar" due to the way we hacked :has()
    - :has() is still behind a flag in Chrome and no Firefox support
- Introduce boundaries or "softly isolated zones"
  - The idea started with: Should fragment lookups with an { origin } within a form prefer to look within the form?
    - Also related to https://github.com/unpoly/unpoly/issues/197 , which would no longer work
      now that a form submission's orgin is the submit button instead of the form element
  - E.g. <div up-boundary>
    - Lookups within prefer to match within the boundary
    - It's a new fallback target
      - Also for errors
    - up.fragment.config.boundaryTargets = ['[up-boundary]', 'form', ':main']
    - Is this also controlled by { fallback }?
    - Maybe identification using [up-boundary=123]
      - But don't enforce this, it's not a great auto-target
    - Should this rather be [up-zone]?
      - If we ever make fully isolated containers we would call them frames
        - https://github.com/unpoly/unpoly/discussions/350
    - We could also offer :zone as a selector
    - Would we still offer { target: '.container .child' }?
      - Would we offer { target: ':zone .foo' }, since it's really the same as { target: '.foo' } ?
    - Is this a repetition of "fragment needs to know whether it is used as component or main target"?
      - We would need to fix infinite looping in expandTargets()
      - It would be nice to disable history in a zone
        - but then it's not usable as a main target
        - Disable history in a container?
          - It's weird to nest multiple containerish elements
        - => This is really already solved through { history: 'auto' }, which only updates history if updating :main
- Rendering: allow { scrollBehavior: 'smooth' } when we're not morphing
  - Could we even allow this *when* morphing?
- What is the purpose of up.error.emitGlobal?
  - Don't we throw a compound error that would be tracked?
    - We do
    - But the error does not bubble up
    - What do we want here?
- New up.render() options to clone from a template
  - { documentTemplate }, { fragmentTemplate }, { contentTemplate }
  - Separate doc page "Rendering from local content"
  - Fail when template cannot be found
  - But what if I really need to re-use an existing element that is then placed back into the body, like in WB?
- Consider implementing an abortable up:navigate event
  - This would be the first feature that goes beyond "navigation is just a preset"
  - People might expect history changes to trigger this
  - Maybe think about this more
- Replace up.hello() and up.script.clean() with MutationObserver()
- Do we want to serialize all actions in a form?
  - up-sequence="form"
  - This would need to abortable on submit => Would be handled by existing { solo: 'target' } IF there is a request
  - This would need to abortable on form destroy => Would be handled by existing { solo: 'target' } IF there is a request
  - => This would need to be handled by up.Queue, or else there would be nothing to abort
  - => It is not sufficient to have up.form.sequence(..., callback)
  - => We would need to do something like { sequence: ElementOfSubtree }
  - => Before picking a new request, make sure no existing request exists
  - What about our old idea: { order: 'abort target', order: 'abort form', order: 'after form', order: 'after selector' }
      => How to say "after ElementObject" ?
  - Who would fetch the element that is 'form' or 'selector'?
      => up.Change.UpdateLayer#getPreflightProps(), which already loads targetElements()
  - What would we do if both was given, e.g. { solo: true, sequence: 'form' }
    - Do we forbid the combination?
    - Do we first abort, then do a squence?
    - Do we first wait, then abort? => I think this, but this also means our { solo } handling is in the wrong place. It must move to the queue.
  - Does { sequence: 'form' } also queue local content, like { solo } ?
   - We could do something like up.LocalRequest, but then local updates would no longer be sync!
   - We could not support { sequence } for local updates => YES
  - What about cached content with { sequence }?
    - We could do queue.asapLocal() which immediately executes unless there is { sequence }
  - How does queue resolve a sequence?
    - Before dispatching a request with { sequence }
    - Check if we have *current* requests with { sequence }
    - If any of the other requests's sequence contains our *or* if any other sequence is contained by ours, don't dispatch
- Guard Events for Rendering could have a Promise for "done"
  - Is this better than setting event.renderOptions.onFinished()?
    - Yes, because onFinished may not fire for fatals or prevented up:fragment:loaded
  - How would this work together with future up.RenderRequest?
  - How would this work together with "local changes are sync"?
- Consolidate [up-validate], [up-switch] and [up-watch] into a tree of form dependencies
  - This way we can selectively disable parts of the form
- Functionality that checks for isDetached() should probably also check for .up-destroying
- Improve `{ focus: 'keep' }` so it focuses the former form group if we lose focus
  - This may be easier said than done
    - we would need to remember the original form group before the swap in the FocusCapsule
    - re-discover the form group in the new HTML
    - check that the form group is a closer match than target-if-lost
    - come up for a better name for the option (target-if-lost)
- New event up:request:solo ?
- Consider delaying appending of new layer elements until we have constructed all children https://github.com/unpoly/unpoly/discussions/314
- Publish { onQueued }
  - We're currently only using onQueued to get the request of a rander job, so we can abort it
    - This may be removed!
  - More canonic would be if RenderJob had an abort() method
- Wir aborten bereits laufende [up-validate] wenn das Formular submitted, wird, aber laufende Watcher-Delays warten können danach noch Dinge tun
  - Wie wäre "submit stoppt das delay"?
  Evtl. Warnung ausbauen: "Will not watch fields without [name]"
- [up-emit] auf Buttons erlauben
- Beim Schließen des Modals prevented jemand up:layer:dismiss, und dann steht "Abort Error: Close event was prevented" in der Konsole.
  - Wollen wir das schlucken?
  - Zumindest bei ui-elementen wie [up-dismiss] ?
- DestructorPass sammelt zwar Exceptions, aber wirft am Ende. Wer fängt das dann? Der Wunsch wäre, dass das drumrumliegende up.destroy() noch zu Ende läuft, dann aber up.CompilerError wirft.
- ConstructorPass sammelt zwar Exceptions, aber wirft am Ende. Wer fängt das dann? Der Wunsch wäre, dass das drumrumliegende up.render() oder up.hello() noch zu Ende läuft, dann aber mit up.CompilerError rejected.
- Update "Long Story" Slides with new API
- Doc page about "Fragments from local HTML"
  - link from [up-document], [up-fragment], [up-content], { document, fragment, content }.
- Warn when registering compiler in [up-] namespace
- Consider documenting errors
  - But what would be the @parent ?
  - up.CannotCompile
  - up.CannotMatch
  - up.Offline
  - up.AbortError
    - has { name: 'AbortError' }


Decisions
=========

- Should the old "clear" be "expire" or "evict"?
  => We really want to push our new defaults for both
  => I think it should be "expire". Most users set a lower expire time.
- remove up.util.flatMap() => No, we need it to flatMap array-like objects (e.g. arguments)
  - Do we want to move to saveState() / restoreState()?
    - I think we want to keep the [up-focus] and [up-scroll] options separate.
      - E.g. we want to focus the main element, but reset scroll.
      - This could also be fixed by revealSnap ?
    - These are eerily similar:
      - https://unpoly.com/scrolling
      - https://unpoly.com/focus
      - The -if-lost suffix can only pertain to focus
    - What would be the name for such an attribute?
      - [up-spotlight]
      - [up-viewport] (classes with [up-viewport]
      - [up-highlight]
      - [up-locus]
      - [up-present]
      - [up-light]
      - [up-shine]
      - [up-state]   (seltsam: up-state=".element")
      - [up-point]
      - [up-pinpoint]
      - [up-attention]
      - [up-focus] also scrolls?
      - [up-show]
      - [up-view]
    => I think power users want to control this separately
    => Also we need to call it at different times
    => Also the auto options work differently, e.g. if there is an [autoscroll] element in the new fragment
    => We might offer a shortcut like [up-view] and [up-save-view] as a shortcut to set both at once
- Replace up.rails by accepting methods / conform from data attributes in options parser
  => This wouldn't work in scenarios where both Rails UJS and Unpoly were active
- No longer send X-Up-Location with every response
  => No we should keep sending it, as this excludes redirect-forwarded up-params
- Consider reverting: up:request:late: Consider the time a promoted request was loading in the background
  => For this we would need to track when a request was promoted to the foreground
- Do we trigger onFinished when preloading?
  => No, users can use the promise or onLoaded()
- Reconsider how many lifecycle callbacks we want to parse from links
  - Benchmark up.link.followOptions()
    - console.time('parse'); for (var i = 0; i < 10000; i++) { up.link.followOptions(link) }; console.timeEnd('parse')
    - VM481:1 parse: 1091.6689453125 ms
    => It takes 0.1 ms
    => This is not a performance issue
- Find a scenario where it's better to read the etag from [etag] instead of response.etag
  - This should not matter for revalidation after a swap
  - When reloading an arbitrary fragment, an earlier response may not be available
- Test if browsers honor cache keys for XHR requests
  - Yes, it honors Cache-Control: max-age=...
  - We can override it for fetch()
- With our long cache eviction background tabs could hog a lot of memory
  => No, since we also limit the number of cache entries to the cache never exceeds some MB
- up.link.cacheState(link) to people can build .offline classes themselves
  => Users can already use up.cache.get
  => We could clean up Request#state and publish this for more goodness
  - Return any known up.Respone for the given link
    - It already has useful properties { evictAge }, { expireAge }?
    - We may eventually offer up.Response#revalidate()
  - Return null while the request is in flight
    => Or do we want an up.CacheState that also returns here?
  - It will be hard to do implement this without actually calling up.link.follow() and up.render(), since e.g. the target choice is hard and part of the cache key
    - Make this an early return in up.Change.FromURL, like with options.preload
- Test if we can preserve element.upPolling (or at least the { forceState }) through up.reload({ data })
  => It's hard since there's the case that the server no longer responds with [up-poll], but we want to keep polling when forceStarted
- Should we delete options.data if a fallback is loaded?
  - This would also be true for other options, like a selector in focus/scroll
  - We would sometimes need to guess, e.g. { focus: ':main' } may also be a good default for a fallback
  => I think this is not a real case since we're not going to use { data } together with { fallback }
- Consider moving [up-etag], [up-time] and related functions to up.protocol
  => While there's some merit to that, we would need to rename up.fragment.etag() to up.protocol.fragmentETag() etc.
  => What's with up.fragment.source()?
- [up-hungry][up-placement]
  => This only makes sence when we have some form of deduping
- What do we log when no replacement target is available? => up.render() throws an error
- Reconsider why we don't call onRendered() for empty updates
  - Pro: Call it for every pass
    - We do still update scroll and focus, even for empty responses
      - Maybe even location?
    - We will update more in the future with head merging
    - There is no other hook for "after $things changed"
      - But nothing changed after an empty render? At least not in the DOM.
    - We can simplify docs for onRender and up-on-render
  - Con: Keep it like now
    - If we render without fallback we still need to check if up.RenderResult#fragment is defined
    - It will be super rare that the first render pass does not return anything.
      - However, we would *always* get empty onRendered calls for revalidation
  => Keep it, but improve docs
- Maybe ship empty unpoly.es5.js und unpoly.es5.min.js that just say to use ES6
  => Not worth the hassle
- Does it make sense to have onKeep in render options?
  => I find it confusing to have both { onKeep } and { useKeep } in the same functions
  => Maybe we can find a way to merge it with { useKeep }
- Consider up.layer.config.isolateLabels
  => Wait until there is a use case
  => Users can always just intercept `click` themselves
- Consider [aria-haspopup]
  => This would require a compiler automatically setting this for [up-layer=new] links (and all shortcuts)
  => Don't do this for performance. Delegate to apps.
- Should config.autoCache allow to cache error responses? => That's a hard question to answer
- Get rid of response.request (which contains references to a layer), response.xhr ?
  => This is hard because up.cache.expire() expires requests, not responses. Hence up.Response delegates { expired } to its response.
- Can we allow await in Callbacks?
  - new AsyncFunction()
  - This would not work trivially with the postprocessing in up.NonceableCallback
    - At least we would need to detect use of `await`
- Returning 'auto' for default would be a good way to override configs with exceptions
  - request.url.endsWith('/edit') ? false : 'auto'
  - Since this already the 'autoMeans' config we cannot return 'auto' here
- Replace u.flatten() with Array#flat()
  => We keep array-related utils because ours work with non-Array lists and iterators
- Replace u.flatMap() with Array#flatMap()
  => We keep array-related utils because ours work with non-Array lists and iterators
- Now that compilers have the meta arg it should be possible to give up.RenderResult new { request, response } props
  => Wait until we have a use case for this
- Test synthetic ETag
  - I think up.Response#headers is not documented
  => There's a simpler way to this documented in https://v3.unpoly.com/up:fragment:loaded#example-discarding-a-revalidation-response
- When rendering uses <up-wrapper> elements, do we set [up-time] and [up-etag] on these wrappers?
  - We cannot really do better here, since up-wrapper children cannot be reloaded
- Move `isRenderableLayer()` logic to LayerLookup
  - Consider having LayerLookup#getAll() throw if results are blank
  => We have a lot of code / specs that work with closed layers and sometimes normalize the layer through up.layer.get(), and now get undefined.
     All of this code would fail with this change.
- Terminology for notifications
  - [up-alerts] (Bootstrap, Tailwind UI, MUI, negative connotation in Material etc.)
  - [up-flashes] (Rails, Primer [although they also use Toast])
  - [up-notifications] (Bulma, good for both success and failure, long word, may also mean passive notifications)
  - [up-messages] (too generic)
  - [up-snackbars] (Material, uncommon)
  - [up-toasts] (uncommon, also often a "boxy" kind of notification)
  - [up-callouts] (Foundation, uncommon)
- Do we want to support changing the renderOptions in up:fragment:hungry? In that case { renderOptions } need to be { nonHungryRenderOptions } or something
  => We can rename the options then. If we do support this we would no longer have { renderOptions }, we would use { targetRenderOptions, hungryRenderOptions }
- Instead of ResponseDoc#commitSteps(), could up.radio.hungrySteps() just re-compress steps with uniqBy(steps, 'selector')?
  => There is an edge case where different selectors could match the same elemnent
- Introduce up:history:restore event
  - With { renderOptions }
  - Note that we used to emit this event in the past, so fix unpoly-migrate
  - Preventable for custom history handling
  => We already have this in up:location:restore
- Reduce render callbacks
  - Motivation
    - It is too hard to do something when the render job settles. There is onRendered, onFinished, onError etc. However there are always cases that are covered by no callback.
    - We need to maintain and communicate two styles of callbacks
  - Expose { renderJob } on guard events
  - New event up:fragment:render / [up-on-render] that gets { renderOptions, renderJob }
    - There is no need to offer { onRender }, as the return value of up.render() is already a RenderJob
  - Deprecate callbacks
    - { onFinished }
    - { onRendered }
  - Update docs
    - https://unpoly.com/render-hooks#preventing-a-render-pass
    - https://unpoly.com/render-hooks#changing-options-before-rendering
  => No, don't do that.
    - While we can return a RenderJob, it's inner promise is not yet set to a RenderResult
    - We also have { onFinished } in other places, e.g. in dismiss() and accept(). There is no CloseJob or similiar there.
- Do we need a way to show a spinner for a while?
  - Maybe, but you can already do in CSS: .container:has(.up-active) .spinner { ... }
- Do we really need to abort requests in LinkPreloader?
  => Yes, aborted requests can be seen in the network tab. We also found a shorter way to write it. 
