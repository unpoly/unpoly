# Module intros batch (71e226056, 0d5f0562d, d979d5af3, d25bf0f19) — awaiting Henning's review

New first paragraphs (= /api hub summaries), verbatim:
- up.link: Links that update a fragment of the current page instead of loading a new document. The server keeps rendering full pages; Unpoly swaps in the targeted fragment and leaves the rest of the page, with its scroll positions, focus and running scripts, untouched.
- up.form: Forms that submit in the background and update a fragment of the current page with the server's response, including validation errors. Fields can also re-render parts of the form while the user is still filling it in.
- up.script: Pairs HTML elements with JavaScript behavior. Instead of running scripts once per page load, you register compilers that enhance matching elements whenever they enter the page: at the initial load, and again with every fragment update.
- up.layer: Opens page fragments in overlays like modal dialogs, drawers or popups, stacked on top of the page. Each layer is isolated: links, forms and lookups only see the layer they are in, so a screen can branch into a subtask and return without losing its state.
- up.fragment: The JavaScript API to render, look up and destroy page fragments. Every link, form, overlay or poll that Unpoly handles ends in `up.render()`, and your own code can call it with the same options.
- up.radio: Fragments that update without the user clicking anything, because the server sent a matching element or a timer ran out.
- up.motion: Animates fragment updates: the old content fades or slides out while the new content comes in. Effects are picked by name in an HTML attribute, or defined with a few lines of JavaScript.
- up.status: Temporary classes and effects that Unpoly applies while the user navigates: a highlighted button while its request loads, a placeholder in the targeted fragment, or a `.up-current` class on links to the current page.
- up.network: The HTTP client behind every request Unpoly makes. It caches responses, revalidates cached content after rendering, aborts requests that would race each other, and tells you when the network is slow or gone.
- up.event: Functions to emit and observe DOM events, with event delegation, automatic cleanup and support for Unpoly's own `up:` events. Events like `up:link:follow` are emitted through the same functions, so your code can observe or prevent them like any other event.
- up.protocol: Optional HTTP headers through which your server can inspect and steer Unpoly's rendering. Unpoly sends headers like `X-Up-Target` with its requests and reads headers like `X-Up-Accept-Layer` from the response.
- up.element: Low-level utilities for raw DOM access and manipulation, complementing the browser's native API. They know nothing about layers or animation; for a fragment-aware API, prefer `up.fragment`.
- up.viewport: Controls scrolling and focus within scrollable containers ("viewports") when fragments are updated. Following a link scrolls the new content into view and focuses it, the way a full page load would; a minor update leaves everything in place.
- up.history: Keeps the browser history working while Unpoly updates fragments. Updating a page's main content changes the address bar and window title like a full page load would, and the Back button restores the earlier content.
- up.util: Helpers for basic JavaScript values like lists, strings, objects and functions, in the spirit of Lodash. Unpoly uses them internally and exposes them so you might not need another utility library in your bundle.
- up.framework: Controls when Unpoly boots. By default Unpoly boots on `DOMContentLoaded`, after your own scripts had a chance to configure it and register compilers.
- up.log: Prints what Unpoly is doing to the browser console: which events are emitted, which requests are made and which compilers run on which elements. By default only errors are logged.

Removed material: up.link Motivation essay + SVGs (→ /links); up.fragment anatomy + "Differences to the DOM API" (condensed); up.motion examples; up.network 7-bullet list; up.event events table; up.protocol IMPORTANT admonition; up.script DOMContentLoaded paragraph; up.util learn-ref url-patterns dropped; up.framework /install#initialization link dropped.
Unverified: up.radio flashes-from-overlays phrasing; up.network "revalidates after rendering"; up.log "which requests are made".
Ref bug: framework.js up.boot / [up-boot=manual] link /install#initialization (shim on CDN heading).
Remaining @see: unpoly-migrate/network.js:148, unpoly-migrate/element.js:178, classes/render_result.js:152, classes/request.js:93,433,473. Site machinery: parser.rb, interface.rb #essential_features, interface_template Essentials block, fixtures, interface_spec (fails now: :39, :44).
