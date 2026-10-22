Script security
================

This page explains how Unpoly's scripting facilities affect security, and how to make them work with a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (or CSP).

Unpoly extends HTML with [attributes that contain JavaScript](#attribute-callbacks), and might also run [`<script>` elements in new fragments](#script-elements). An existing Content Security Policy is generally honored. You can configure Unpoly to be more permissive or more restrictive when executing scripts.


Providing the CSP nonce {#meta-csp-nonce}
-----------------------

The sections below show several ways to run Unpoly's JavaScript under a strict CSP.
Those that use nonces have one thing in common: Unpoly must know which nonce your CSP allows
for the current page. To provide this *CSP nonce*, include a `<meta name="csp-nonce">` tag
in the `<head>` of the initial page load:

```html
<head>
  <meta name="csp-nonce" content="secret123"> <!-- mark: secret123 -->
  ...
</head>
```

Its value is the nonce from the CSP header of the same response.
To provide the nonce some other way, configure `up.script.config.cspNonce()`.

> [important]
> Once Unpoly knows your CSP nonce, it will enforce nonces in all [callbacks](#attribute-callbacks).\
> [Script elements](#script-elements) without nonces are still allowed, as long as they pass your CSP checks.


Callbacks in attributes {#attribute-callbacks}
-----------------------

Unpoly introduces new HTML attributes that can execute JavaScript code.\
These generally work like [`[onclick]`](https://www.w3schools.com/jsref/event_onclick.asp) or
[`[onload]`](https://www.w3schools.com/tags/ev_onload.asp) attributes in vanilla HTML.

```html
<a
  href="/path"
  up-follow
  up-on-loaded="console.log('Received response', event.response)"> <!-- mark: up-on-loaded -->
  Click link
</a>

<form>
  <input
    type="text"
    name="title"
    up-watch="console.log('Field has new value', value)"> <!-- mark: up-watch -->
</form>
```

### What callbacks are allowed? {#callback-policy}

Unpoly will execute callbacks on a page without a CSP, or with a CSP that allows `unsafe-eval`.

You can configure a stricter behavior with `up.script.config.evalCallbackPolicy`:

| `evalCallbackPolicy` | Runs without CSP?  | Runs with CSP?     | Runs with CSP and [`<meta name="csp-nonce">`](#meta-csp-nonce)? |
|----------------------|--------------------|--------------------|-----------------------------------------------------------------|
| `auto` (default)     | Always             | ⚠️ With `unsafe-eval` | With allowed nonce                                              |
| `pass`               | Always             | ⚠️ With `unsafe-eval` | ⚠️ With `unsafe-eval`                                           |
| `block`              | Never              | Never              | Never                                                           |
| `nonce`              | With allowed nonce | With allowed nonce   | With allowed nonce                                              |


### Running callbacks with a strict CSP {#callback-with-strict-csp}

When your CSP doesn't allow `unsafe-eval`, callbacks like `[up-on-loaded]` will fail with an error like this:

```text
Uncaught EvalError: call to Function() blocked by CSP
```

You can address this by [prefixing callback nonces](#callback-nonces)
or by [replacing callbacks with event listeners](#listener-for-callback).


### Restricting callbacks with nonces {#callback-nonces}

You can configure Unpoly to only run callbacks with an allowed nonce.
This allows you to selectively allow callbacks, even with a strict CSP.

```js
up.script.config.evalCallbackPolicy = 'nonce'
```

With a [CSP nonce](#meta-csp-nonce) of `secret123`, only callbacks with a matching nonce will be executed:

```html
<a href="/path" up-follow up-on-loaded="nonce-secret123 console.log('Hi world')">
  ✔ Callback will run
</a>

<a href="/path" up-follow up-on-loaded="nonce-wrong789 console.log('Hi world')">
  ❌ Callback will NOT run
</a>
```

The `nonce-` prefix is static, followed by your random nonce in Base64, followed by a space and your original JavaScript code.

Nonces in your HTML only need to match the response you're currently rendering.
Unpoly will [rewrite your HTML](#nonce-rewriting) so all allowed nonces match the current document.

> [note]
> Prefixing nonces only works for `[up-on...]` attributes. You cannot use it for native HTML attributes like `[onclick]`.


### Replacing callbacks with event listeners {#listener-for-callback}

When we don't want to use HTML-based callbacks, we can move them to a `.js` file that we loaded via an allowed `<script>` element.

Let's say you have a callback like this:

```html
<a href="/path" up-follow up-on-loaded="alert('Go!')">Click me</a>
```

We can introduce a new `.alert-on-loaded` class that we assign to the link:

```html
<a href="/path" up-follow class="alert-on-loaded">Click me</a>
```

Then this JavaScript listener intercepts clicks on elements with that class:

```javascript
up.on('up:link:follow', '.alert-on-loaded', (event) => {
  event.renderOptions.onLoaded = () => alert('Go!')
})
```


Callbacks in headers {#header-callbacks}
--------------------

When the server [opens an overlay](/api/X-Up-Open-Layer), its `X-Up-Open-Layer` header can pass
callbacks like `{ onAccepted }` as a string of JavaScript:

```http
X-Up-Open-Layer: { onAccepted: 'up.reload("#users-list")' }
```

These callbacks follow the same [policy](#callback-policy) as callbacks in attributes.
With a strict CSP, [prefix them with your CSP nonce](#callback-nonces):

```http
X-Up-Open-Layer: { onAccepted: 'nonce-secret123 up.reload("#users-list")' }
```

To only reload an element after the overlay closes, pass its selector as `{ onAcceptedReload }` or `{ onDismissedReload }`.
This runs no JavaScript, so it needs no nonce:

```http
X-Up-Open-Layer: { onAcceptedReload: '#users-list' }
```

For other callbacks, you can keep JavaScript out of your response headers. Send a custom header with the data your callback needs,
like `X-Reload-On-Accept` below. A listener in a script file reads it and sets the callback:

```http
X-Up-Open-Layer: {}
X-Reload-On-Accept: #users-list
```

```js
up.on('up:fragment:loaded', function(event) {
  let selector = event.response.header('X-Reload-On-Accept')
  if (selector) event.renderOptions.onAccepted = () => up.reload(selector) // mark: event.renderOptions.onAccepted
})
```


Script elements {#script-elements}
----------------------------------

When Unpoly inserts a **new fragment** containing a `<script>` element, that script will generally run if it passes CSP checks: 

```html
<div id="fragment">
  <script>
    <!-- chip: ✔️ Will run when allowed by CSP -->
  </script>
</div>
```

You can configure a stricter behavior for new fragments with `up.script.config.scriptElementPolicy`:

| `scriptElementPolicy` | Runs without CSP?  | Runs with CSP?     | Runs with `strict-dynamic` CSP? |
|-----------------------|--------------------|--------------------|---------------------------------|
| `auto` (default)      | Always             | If passes CSP      | With allowed nonce              |
| `pass`                | Always             | If passes CSP      | ⚠️ Always                       |
| `block`               | Never              | Never              | Never                           |
| `nonce`               | With allowed nonce | With allowed nonce | With allowed nonce              |


> [note]
> Configuration will only affect new fragments in the `<body>`.
> The initial page load is solely governed by your CSP.


### Restricting script elements with nonces {#script-element-nonces}

If you want to be restrictive about `<script>` execution,
you can configure Unpoly to only run scripts with an allowed `[nonce]` attribute:

```js
up.script.config.scriptElementPolicy = 'nonce'
```

With a [CSP nonce](#meta-csp-nonce) of `secret123`, Unpoly will block any script without a matching nonce:

```html
<div id="fragment">
  <script nonce="secret123">  <!-- mark: secret123 -->
    <!-- chip: ✔️ Will run -->
  </script>

  <script>
    <!-- chip: ❌ Will NOT run -->
  </script>

  <script nonce="wrong456">
    <!-- chip: ❌ Will NOT run -->
  </script>
</div>
```

Nonces in your HTML only need to match the response you're currently rendering.
Unpoly will [rewrite your HTML](#nonce-rewriting) so all allowed nonces match the current document.


### Nonces required with `strict-dynamic` {#strict-dynamic}

A CSP with [`strict-dynamic`](https://content-security-policy.com/strict-dynamic/) allows any allowed script
to load additional scripts. Because Unpoly is already an allowed script,
this would allow *any* Unpoly-rendered script to execute.

To prevent this, Unpoly requires [matching CSP nonces](#script-element-nonces)
in any response with a `strict-dynamic` CSP.


Nonces are rewritten {#nonce-rewriting}
--------------------

The CSP header from the initial page load exclusively defines the nonces allowed for the lifetime of the document.
When Unpoly loads new fragments from the server, any nonces will match their own response, but not the existing
document. To address this, Unpoly will verify and rewrite nonces before a fragment is placed into the page.
For this Unpoly needs to know your [CSP nonce](#meta-csp-nonce).

### How responses are altered {#response-processing} 

```http
Content-Type: text/html
Content-Security-Policy: script-src 'self' 'nonce-match456'
...

<script nonce="match456">
  // ✔ Nonce will be rewritten to the CSP nonce (secret123)
</script>

<script nonce="wrong789">
  // ❌ Nonce will NOT be rewritten
</script>
```

Note how nonces in your HTML only need to match the response you're currently rendering.\
You do *not* need to track and re-use the nonce of the initial page load.


### Only `script-src` directives are supported

Unpoly's CSP parser has some limitations:

- When verifying responses, only the `script-src` directive is parsed.
- A `default-src` directive is parsed if no `script-src` directive is set.
- The `script-src-elem` and `script-src-attr` directives are not currently supported.
- Unpoly does not rewrite CSP nonces for non-script elements, such as stylesheets or images.


@page script-security
