import * as u from './util.js'
import * as e from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { newConfig } from './util/config.js'
import { on } from './event.js'
import { getDisablePreviewFn } from './form.js'
import { matchSelectorMap } from './fragment.js'
// Not through framework.js, which may not be evaluated yet when we create a Registry below.
import { Registry } from './framework/registry.js'
import { layerStack, type Layer } from './layer.js'
import { printToStandard } from './log.js'
import { type UpRequest } from './network.js'
import { FocusCapsule } from './viewport.js'
import type * as t from './status/types.js'
export type * from './status/types.js'
import { LinkCurrentURLs } from './status/link_current_urls.js'
import { Preview } from './status/preview.js'

// A nav remembers the locations its links were last compared with.
type NavElement = Element & { upNavLocations?: string[] }

// A link remembers its parsed URLs, and the area it expands to with [up-expand].
type NavLink = Element & { upCurrentURLs?: LinkCurrentURLs, upExpandedPair?: Element[] }

interface NavUpdateOptions {
  // The links in the navs have changed.
  newLinks: boolean
  // A layer's location has changed.
  anyLocationChanged: boolean
}

/*-
Features to show which request is loading and which link leads to the current page.

While a request is loading, the origin element that triggered it gets an `.up-active` class and the targeted fragments get `.up-loading`. For richer loading state, a link or form can show an `[up-placeholder]` inside the fragment it targets, or name an `[up-preview]` function registered with `up.preview()`. A preview can change the page in any way, up to rendering the expected result before the server confirms it. Every effect is reverted when the request ends.

Within an `[up-nav]` container, links pointing to the current location are marked `.up-current`, and the class moves as the user navigates.

@learn-ref loading-state
@learn-ref navigation-bars

@namespace up.status
*/


/*-
Sets default options for status effects.

@property up.status.config

@section Feedback classes
  @param {Array<string>} [config.activeClasses=['up-active']]
    An array of classes to set on [activated links or form elements](/api/up-active).

  @param {Array<string>} [config.loadingClasses=['up-loading']]
    An array of classes to set on [loading fragments](/api/up-loading).

  @param {Array<string>} [config.revalidatingClasses=['up-revalidating']]
    An array of classes to set on [revalidating fragments](/api/up-revalidating).

    @experimental

@section Navigational containers
  @param {Array<string>} [config.navSelectors=['[up-nav]', 'nav']]
    An array of CSS selectors that match [navigational containers](/learn/navigation-bars).

  @param {Array<string>} [config.noNavSelectors=['[up-nav=false]']]
    Exceptions to `up.status.config.navSelectors`.

  @param {Array<string>} [config.currentClasses=['up-current']]
    An array of classes to set on [links that point the current location](/api/up-current).

@stable
*/
export const statusConfig = newConfig('up.status.config', (): t.StatusConfig => ({
  currentClasses: ['up-current'],
  activeClasses: ['up-active'],
  loadingClasses: ['up-loading'],
  revalidatingClasses: ['up-revalidating'],
  navSelectors: ['[up-nav]', 'nav'],
  noNavSelectors: ['[up-nav=false]'],
}))

export let namedPreviewFns = new Registry<t.PreviewFn>('preview')

/*-
Registers a named [preview](/learn/previews) function.

Preview functions are applied using the `[up-preview]` attribute or [`{ preview }`](/api/up.render#options.preview) option.
See [Previews](/learn/previews) for an overview.

## Example

This preview sets a temporary `[app-loading=true]` attribute on the targeted fragment:

```js
up.preview('loading-attr', function(preview) {
  preview.setAttrs({ 'app-loading': true })
})
```

The `preview` argument is an `up.Preview` instance that offers many utilities to make temporary changes.
For example, you can use it to insert or move elements, add classes or set attributes.

We can use the `loading-attr` preview in any link or form by setting an `[up-preview]` attribute:

```html
<a href="/edit" up-follow up-preview="loading-attr">Edit page</a> <!-- mark: up-preview="loading-attr" -->
```

## Accepting parameters {#parameters}

Preview functions can accept an options object as a second argument.
This is useful to define multiple variations of a preview effect.

For example, the following preview accepts a `{ size }` option to show a spinner of varying size:

```js
up.preview('spinner', function(preview, { size = 50 }) {
  let spinner = up.element.createFromSelector('img', { src: 'spinner.gif', width: size })
  preview.insert(preview.fragment, spinner)
})
```

From HTML you can append the options to the `[up-preview]` argument, after the preview name:

```html
<a href="/edit" up-follow up-preview="spinner { size: 100 }">Edit page</a> <!-- mark: { size: 100 } -->
```

@function up.preview
@param {string} name
  The name of the preview.
@param {Function(up.Preview, Object)} callback
  The function that applies the temporary page mutation.

  Any [preview parameters](#parameters) will be passed as a second argument.
@stable
*/

const SELECTOR_LINK = 'a, [up-href]'

function linkCurrentURLs(link: NavLink): LinkCurrentURLs {
  // Check if we have computed the URLs before.
  // Computation is sort of expensive (multiplied by number of links),
  // so we cache the results in a link property
  return link.upCurrentURLs ||= new LinkCurrentURLs(link)
}

function getNavLocations(nav: Element): string[] {
  let layerRef = e.stringAttr(nav, 'up-layer') || 'origin'
  let layers = layerStack.getAll(layerRef, { origin: nav })
  return u.compact(layers.map(getMatchableLayerLocation))
}

function updateNav(nav: NavElement, links: u.List<Element>, { newLinks, anyLocationChanged }: NavUpdateOptions): void {
  // Only look up current layer locations when either:
  //
  // (1) the location changed (anyLocationChanged = true) or
  // (2) we haven't cached previous locations
  //
  // Otherwise we re-use the previous locations.
  let currentLocations = (!anyLocationChanged && nav.upNavLocations) || getNavLocations(nav)

  // We only process when either:
  //
  // (1) We have unprocessed links (newLinks = true)
  // (2) The location for this nav's [up-layer] setting changed
  if (newLinks || !u.isEqual(nav.upNavLocations, currentLocations)) {
    for (let link of links) {
      const isCurrent = linkCurrentURLs(link).isAnyCurrent(currentLocations)
      for (let currentClass of statusConfig.currentClasses) {
        link.classList.toggle(currentClass, isCurrent)
      }
      e.setAttrPresence(link, 'aria-current', 'page', isCurrent)
    }

    // Remember which locations we last processed
    nav.upNavLocations = currentLocations
  }
}

/*-
Looks for [up-nav] containers in the given fragment and updates their contained links.
Because we update full navs, we only need to lookup layer locations once.

@function updateNavsAround
@internal
*/
function updateNavsAround(root: Element, opts: NavUpdateOptions): void {
  const navSelector = statusConfig.selector('navSelectors')
  const fullNavs = e.around(root, navSelector)

  for (let fullNav of fullNavs) {
    let links = e.subtree(fullNav, SELECTOR_LINK)
    updateNav(fullNav, links, opts)
  }
}

function getMatchableLayerLocation(layer: Layer): string | undefined {
  return u.matchableURL(layer.location)
}


/*-
@function findActivatableAreas
@param {string|Element|jQuery} element
@internal
*/
function findActivatableAreas(element: NavLink): Element[] {
  return element.upExpandedPair || [element]
}

/*-
While rendering, the `.up-active` class is added to the [origin](/api/origin) element that triggered the change.

The class remains set while the request is loading.
It is removed when the request [ends](/api/up.Request.prototype.ended) for any reason.

@learn-ref feedback-classes

> [tip]
> If you're looking to style the [targeted](/learn/targeting-fragments) fragment, see `.up-loading`.

@selector .up-active
@stable
@signature
*/

/*-
While rendering, all [targeted fragments](/learn/targeting-fragments) are assigned the `.up-loading` class.

The class remains set while the request is loading.
It is removed when the request [ends](/api/up.Request.prototype.ended) for any reason.

@learn-ref feedback-classes

> [tip]
> If you're looking to style the [origin](/api/origin) that targeted the fragment, see `.up-active`.

@selector .up-loading
@stable
@signature
*/

/*-
While [revalidating](/learn/caching#revalidation) content rendered from a stale cache entry,
all [targeted fragments](/learn/targeting-fragments) are assigned the `.up-revalidating` class.

The class remains set while the revalidation request is loading.
It is removed when the request [ends](/api/up.Request.prototype.ended) for any reason.

@learn-ref feedback-classes

## Example

This fragment has been rendered from an older cache entry. Unpoly will automatically send a revalidation request
and marks the fragment as `.up-revalidating`:

```html
<div id="target" class="up-revalidating"> <!-- mark: class="up-revalidating" -->
  Possibly stale content
</div>
```

You can style revalidating fragments to convey that content might be stale:

```css
.up-revalidating {
  filter: grayscale(80%);
  opacity: 0.5;
}
```


@selector .up-revalidating
@experimental
*/

export function runPreviews(request: UpRequest, renderOptions: u.PlainObject): () => void {
  // Previews run while the request is in flight, before it evicts its layers.
  let { bindLayer } = request as UpRequest & { bindLayer: Layer }
  let focusCapsule = FocusCapsule.preserve(bindLayer)
  let applyPreviews = () => doRunPreviews(request, renderOptions)
  let revertPreviews = bindLayer.asCurrent(applyPreviews)
  focusCapsule?.autoVoid()
  return () => {
    bindLayer.asCurrent(revertPreviews)
    focusCapsule?.restore(bindLayer, { preventScroll: true })
  }
}

function doRunPreviews(request: UpRequest, renderOptions: u.PlainObject): () => void {
  let { fragment, fragments, origin } = request
  let cleaner = u.cleaner()
  let previewForFragment = (fragment: Element | undefined) => new Preview({ fragment, request, renderOptions, cleaner })

  // Some preview effects only run once per render pass.
  // The { fragment } for these previews will be the first fragment,
  // or null if there is no first fragment (when opening a layer).
  let singlePreview = previewForFragment(fragment)
  singlePreview.run(resolvePreviewFns(renderOptions.preview))
  singlePreview.run(getPlaceholderPreviewFn(renderOptions.placeholder))
  singlePreview.run(getFeedbackClassesPreviewFn(renderOptions.feedback, fragments))
  singlePreview.run(getDisablePreviewFn(renderOptions.disable, origin))

  // Other fragment effects run once per targeted fragment.
  // This is useful for batched validations, where we may update multiple fragments,
  // but each with individual preview effects.
  for (let fragment of fragments) {
    let eachPreview = previewForFragment(fragment)
    eachPreview.run(matchSelectorMap(fragment, renderOptions.previewMap))
    eachPreview.run(matchSelectorMap(fragment, renderOptions.placeholderMap).flatMap(getPlaceholderPreviewFn))
  }

  return cleaner.clean
}

/*-
Links or forms can name a [preview function](/learn/previews) that is called while
loading content from the server.

When the user interacts with a link or form, its preview function is invoked immediately.
The function will usually [mutate the DOM](/learn/previews#basic-mutations) to signal that the app is working
or to provide clues for how the page will ultimately look.
For example, if the user is deleting an item from a list, the preview
function could hide that item visually.

See [Previews](/learn/previews) for details and examples.

@learn-ref previews

## Usage

To refer to a preview function, set its name as an `[up-preview]` attribute:

```html
<a href="/edit" up-follow up-preview="spinner">Edit page</a> <!-- mark: up-preview="spinner" -->
```

To [call multiple previews](/learn/previews#multiple), separate their names with a comma:

```html
<a href="/edit" up-follow up-preview="spinner, dim-page">Edit page</a> <!-- mark: up-preview="spinner, dim-page" -->
```

[Preview options](/learn/previews#parameters) can be appended after each preview name, encoded as [relaxed JSON](/api/relaxed-json):

```html
<a href="/edit"
   up-follow
   up-preview="spinner { size: 20 }, dim-page { animation: 'pulse' }"> <!-- mark: spinner { size: 20 }, dim-page { animation: 'pulse' } -->
  Edit page
</a>
```

@selector [up-preview]

@param up-preview
  The name of a preview function defined with `up.preview()`.

  To call multiple previews, separate names with a comma.

@stable
@signature
*/

/*-
Links or forms can define a [placeholder](/learn/placeholders) that will be shown within the targeted
fragment while loading content from the server.

All other children of the targeted fragment will be hidden while
the request is in flight. When the request [ends](/api/up.Request.prototype.ended) for any reason,
the placeholder will be removed and the original fragment children will be shown again.

When [targeting multiple fragments](/learn/targeting-fragments#multiple),
the placeholder will be shown in the first fragment.

@learn-ref placeholders

## Example

This link will show the message *"Loading…"* within `#target` while its request is loading:

```html
<a href="/path" up-target="#target" up-placeholder="<p>Loading…</p>">Show story</a> <!-- mark: up-placeholder="<p>Loading…</p>" -->

<div id="target">
  Old content
</div>
```

See [Placeholders](/learn/placeholders) for details and elaborate examples.

@selector [up-placeholder]
@param up-placeholder
  The HTML string for the placeholder.

  You can also [use a template](/learn/placeholders#from-template)
  by setting this attribute to a CSS selector matching
  a `<template>` or `<script>` element.
@experimental
@signature
*/

function getPlaceholderPreviewFn(placeholder: any): t.PreviewFn | undefined {
  if (!placeholder) return

  return function(preview) {
    preview.showPlaceholder(placeholder)
  }
}

export function resolvePreviewFns(value: any): t.PreviewFn[] {
  if (u.isFunction(value)) {
    return [value]
  } else if (u.isString(value)) {
    return resolvePreviewString(value)
  } else if (u.isArray(value)) {
    return value.flatMap(resolvePreviewFns)
  } else {
    return []
  }
}

function resolvePreviewString(str: string): t.PreviewFn[] {
  return u.map(u.parseScalarJSONPairs(str), ([name, parsedOptions]) => {
    let previewFn = namedPreviewFns.get(name)

    return function(preview, runOptions) {
      printToStandard('[up-preview]', 'Showing preview %o', name)
      return previewFn(preview, parsedOptions || runOptions)
    }
  })
}

function getActiveElements({ origin, activeElements }: u.PlainObject): Element[] {
  activeElements ||= u.wrapList(origin)
  // If the link area was grown with [up-expand], we highlight the [up-expand] container.
  return u.flatMap(activeElements, findActivatableAreas)
}

function getFeedbackClassesPreviewFn(feedbackOption: boolean | undefined, fragments: Element[]): t.PreviewFn | undefined {
  if (!feedbackOption) return

  return function(preview) {
    const { renderOptions } = preview

    if (renderOptions.expiredResponse) {
      preview.addClassBatch(fragments, statusConfig.revalidatingClasses)
    } else {
      preview.addClassBatch(getActiveElements(renderOptions), statusConfig.activeClasses)
      preview.addClassBatch(fragments, statusConfig.loadingClasses)
    }
  }
}

export function statusOptions(element: Element, options?: u.PlainObject, parserOptions?: e.OptionsParserOptions): u.PlainObject {
  options = u.newOptions(options)
  const parser = new OptionsParser(element, options, parserOptions)
  parser.booleanOrString('disable')
  parser.boolean('feedback')
  parser.string('preview')
  parser.booleanOrString('revalidatePreview')
  parser.string('placeholder')
  return options
}

/*-
Marks this element as a [navigational container](/learn/navigation-bars), such as a menu or navigation bar.

When a link within an `[up-nav]` element points to [its layer's location](/api/up.layer.location),
it is assigned the `.up-current` class. When the browser navigates to another location, the class is removed automatically.

@learn-ref navigation-bars

## Example

Let's look at a simple menu with two links:

```html
<div up-nav> <!-- mark: up-nav -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</div>
```

When the browser location changes to `/foo`, the first link is marked as `.up-current`:

```html
<div up-nav>
  <a href="/foo" class="up-current">Foo</a> <!-- mark: class="up-current" -->
  <a href="/bar">Bar</a>
</div>
```

When the browser location changes to `/bar`, the first link loses its `.up-current` class.
Now the second link is marked as `.up-current`:

```html
<div up-nav>
  <a href="/foo">Foo</a>
  <a href="/bar" class="up-current">Bar</a> <!-- mark: class="up-current" -->
</div>
```

@selector [up-nav]
@param [up-layer="origin"]
  The [layers](/api/up.layer) for which to match link locations.

  By default, links are only marked as current when they point to the location *of their own layer*.
  To highlight links that point to the location of *another* layer, set this attribute to
  any [layer option](/learn/targeting-other-layers).

  If the configured option matches multiple layers (e.g. `any` or `current, root`),
  links are highlighted if they match the location of any matching layer.

  See [Matching the location of other layers](/learn/navigation-bars#layers) for examples.
@stable
@signature
*/

/*-
Links within [navigational containers](/learn/navigation-bars)
may use the `[up-alias]` attribute to define alternative URLs for which they
should also be highlighted as `.up-current`.

@learn-ref navigation-bars#aliases

### Example

The link below will be highlighted with `.up-current` at both `/profile` and `/profile/edit` locations:

```html
<nav>
  <a href="/profile" up-alias="/profile/edit">Profile</a>
</nav>
```

To configure multiple alternative URLs, use a [URL pattern](/api/url-patterns).

### Setting URL aliases from macros {#from-macro}

An `[up-alias]` attribute can be set by a [macro](/api/up.macro).

This can be useful to link nested navigation trees programmatically.\
Let's say we have a main navigation linking to two sections:

```html
<nav class="main-nav">
  <a href="/companies" data-section="companies">Companies</a> <!-- mark: data-section="companies"-->
  <a href="/users" data-section="users">Users</a> <!-- mark: data-section="users"-->
</nav>
```

We also have a sub-navigation for each section:

```html
<nav class="sub-nav" data-section="companies"> <!-- mark: data-section="companies"-->
  <a href="/companies">All companies</a>
  <a href="/companies/sync">Sync CRM</a>
  <a href="/companies/export">Export</a>
</nav>

<nav class="sub-nav" data-section="users"> <!-- mark: data-section="users"-->
  <a href="/users">All users</a>
  <a href="/users/online">Now online</a>
  <a href="/users/profile">Your profile</a>
</nav>
```

We want the main navigation section to be `.up-current` for any sub-section URL.
We can do that with a macro that finds the respective sub-navigation, and sets an `[up-alias]` attribute at the main navigation link:

```js
up.macro('.main-nav a', function(link, { section }) {
  let subLinks = document.querySelectorAll(`.sub-nav[data-section="${section}"] a`)
  let subURLs = up.util.map(subLinks, (subLink) => subLink.getAttribute('href'))
  link.setAttribute('up-alias', subURLs.join())
})
```


@selector [up-alias]
@param up-alias
  A [URL pattern](/api/url-patterns) with alternative URLs.
@stable
*/

/*-
When a link within a [navigational container](/learn/navigation-bars) points to the current location, it is assigned the `.up-current` class.

@learn-ref navigation-bars

## Example

@include nav-example

@selector .up-current
@stable
@signature
*/

export function install(): void {
  on('up:compilers:before', (_event, newFragment) => {
    updateNavsAround(newFragment, { newLinks: true, anyLocationChanged: false })
  })

  on('up:layer:location:changed up:layer:opened up:layer:dismissed up:layer:accepted', () => {
    updateNavsAround(document.body, { newLinks: false, anyLocationChanged: true })
  })
}

export const api = {
  status: {
    config: statusConfig,
    // showAroundRequest,
    preview: namedPreviewFns.put,
  },
  preview: namedPreviewFns.put,
}
