# Philosophy

## Values

These values guide us when we decide which features to add, and how we design them.

- **Unpoly is app-centric HTML from the future.** We extend the document-centric HTML with functionality required by non-trivial, interactive web applications. This enables use cases traditionally thought to require heavy JS, e.g. for dynamic forms, intricate overlay interactions or optimistic rendering.
- **Backend agnostic.** Unpoly works with any server framework that produces HTML, or even with a folder with static HTML. We don't require a frontend build pipeline.
- **Progressive enhancement.** We enhance server-rendered HTML with better UI/UX. We require little to no changes to existing server-side templates.
- **Graceful degradation.** Every feature we design should have a graceful degradation story. Server-rendered HTML should retain basic function without Unpoly (or JS). E.g. a link that would open an animated overlay with Unpoly will, without Unpoly, load the same content as a full page, without animation. Much of this comes from using existing HTML elements as intended by the browser platform: Hyperlinks stay `<a href>`, forms stay `<form>`. Enhancements are added through attributes like `[up-target]` or `[up-transition]`.
- **High level API with secondary considerations covered by default.** We don't just paint rectangles on the screen and leave it to the developer to handle edge cases. Instead we understand developer intent and apply strong defaults, like dealing with concurrent input or flaky connections, handling scroll positions, preserving focus, updating history, caching, etc.
- **Every line must pull its weight.** While Unpoly isn't the smallest library, it exposes a *ton* of functionality per KB of code. We agonize over every added line of code, which must provide significant value or be dropped. We sometimes use suboptimal coding patterns when it saves bytes (such as passing around giant, mutable option objects). Unpoly has zero dependencies and always will.
- **No race conditions.** We take great care to always behave consistently, even under heavy async pressure (slow networks, wild user inputs, fast browser automation). We don't ever delay a callback with `setTimeout()` and hope that nothing unexpected happens within that task. Parts of Unpoly deliberately stay synchronous to completely preclude concurrency, and to never make incomplete state observable.


## Layered APIs

**Simple things should be simple:** Unpoly tries to always provide the most high-level API possible, using smart defaults, guessing developer intent and convention-over-configuration. Common use cases must be implementable with a concise call site, usually by setting a single HTML attribute or by invoking a single function.

**Complex use cases must be possible:** When our defaults don't fit, developers can override them with explicit options, reconfigure Unpoly globally, or hack Unpoly's lifecycle with event handlers. If that still isn't enough, developers can use a low-level JavaScript API that still re-uses some of Unpoly's logic. Verbose call-sites are acceptable for low-level API usage.

### Example: From high-level API to low-level API

Setting an `[up-follow]` attribute causes Unpoly to follow a link. By convention, Unpoly will assume that the developer wants to update the main content area (the `<main>` element):

```html
<a href="/path" up-follow>
  Click to update main
</a>

<main>
  I will be updated
</main>
```

Because `[up-follow]` is a *high-level* API, it will make many assumptions: That you want to update the dominant content area (`<main>`), that you want to cache the response for some seconds, etc. It also takes care of secondary considerations such as scrolling, focus, browser history, unexpected server responses, etc.

All defaults can be disabled or changed. For example, if the developer wants to update another element, they can explicitly override the default by also setting an `[up-target]` attribute:

```html
<a href="/path" up-follow up-target="#content">
  Click to update content
</a>

<div id="content">
  I will be updated
</div>
```

The implementation of the `[up-follow]` attribute does many things internally, like making a request, waiting for the response, updating the DOM or handling error cases. During this lifecycle Unpoly emits dozens of DOM events that can be used to modify the behavior. For example, this listener will intercept the `up:link:follow` event to show a confirm dialog before navigating away from an unsaved form:

```js
document.addEventListener('up:link:follow', (event) => {
  if (document.querySelector('form.unsaved') && !confirm('Leave this page and discard unsaved form?')) {
    event.preventDefault() // don't follow the link
  }
})
```

All HTML attributes have a corresponding JavaScript function that triggers their effect programmatically. For example, this code will automatically follow a link after 1 second, using the same options and behavior as if it had been clicked by the user:

```js
let element = document.querySelector('a[href]')
setInterval(() => up.link.follow(element), 1000)
```

If the developer needs even more control, there are often low-level functions. For example, `up.render({ target, document })` only updates a single DOM element with no other default behavior:


```js
let html = await getHTMLByOtherMeans()

up.render({ target: '#content', document: html })
```

Because `up.render()` is a *low-level* feature, any secondary considerations (scrolling, history, etc.) must be handled by the developer with extra code.
