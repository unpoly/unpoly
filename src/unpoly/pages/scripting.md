Scripting
=========

Unpoly pairs HTML elements with JavaScript behavior. Instead of running scripts
once per page load, you register *compilers* that enhance matching elements whenever
they enter the page: at the initial load, and again with every fragment update.


Enhancing elements
------------------

To enhance matching elements with JavaScript, register a compiler function with `up.compiler()`:

```js
up.compiler('.current-time', function(element) {
  element.textContent = new Date().toString()
})
```

The function is called once for each `.current-time` element, when the page first
loads and when a matching fragment is rendered later. This replaces listening
to `DOMContentLoaded`, which only fires for the initial page.

A compiler can return a *destructor* function. Unpoly calls it when it removes
the element, e.g. when the surrounding fragment is swapped. This keeps effects
like timers or global listeners from outliving their element:

```js
up.compiler('.current-time', function(element) {
  let update = () => element.textContent = new Date().toString()
  let timer = setInterval(update, 1000)
  return () => clearInterval(timer) // mark: return
})
```

<p class="read-more"><a href="/enhancing-elements">Read more: Enhancing elements with JavaScript</a></p>


The page is long-lived
----------------------

When Unpoly updates a fragment, the browser keeps the same document and JavaScript
environment, often through many navigations. Compilers and destructors scope your
behavior to an element's lifetime, so the long-lived page accumulates no stale
listeners or timers.


Attaching data to elements
--------------------------

The server can attach structured data to an element, as [relaxed JSON](/relaxed-json)
in an `[up-data]` attribute:

```html
<span class="user" up-data="{ age: 31, name: 'Alice' }">Alice</span> <!-- mark: up-data -->
```

The parsed data is passed to your compiler as a second argument:

```js
up.compiler('.user', function(element, data) { // mark: data
  console.log(data.name) // result: "Alice"
})
```

<p class="read-more"><a href="/data">Read more: Attaching data to elements</a></p>


Mounting framework components
-----------------------------

A compiler can mount a component from a frontend framework like React or Vue,
as an *island* within a server-rendered page:

```js
up.compiler('.color-picker', function(element, data) {
  let root = createRoot(element)
  root.render(<ColorPicker value={data.value}/>)
  return () => root.unmount() // mark: return
})
```

The component mounts when its element enters the page, receives props from server data,
and unmounts when the fragment around it is swapped.

<p class="read-more"><a href="/islands">Read more: Framework islands</a></p>


Also in this topic
------------------

To clone HTML from `<template>` elements without a server request, see [[templates]].

To convert existing `DOMContentLoaded` scripts to compilers, see [[legacy-scripts]].

To control how scripts and callbacks run under a Content Security Policy, see [[script-security]].

@page scripting
@menu-title Overview
@signature
