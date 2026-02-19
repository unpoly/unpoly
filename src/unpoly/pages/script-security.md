Script security
================

This page explains how Unpoly's scripting facilities affect security, and how to make them work with a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (or CSP).

Unpoly extends HTML with [attributes that contain JavaScript](#callbacks), and might also run [`<script>` elements in new fragments](#script-elements). An existing Content Security Policy is generally honored. You can configure Unpoly to be more permissive or more restrictive when executing scripts.


<!--
General advice
--------------

This advice is not specific to Unpoly.

### Escape untrusted input {#escape-html}

Any value read from a request or from the database should be considered untrusted user input.
Escape it before rendering it in HTML. This prevents malicious users from injecting `<script>` tags or attributes like `onclick`.

Some templating libraries escape variables by default, and only allow HTML in explicitly marked interpolations. This way you cannot accidentally
forget to escape.

### Use a Content Security Policy (CSP)

Use the `Content-Security-Policy` header to globally restrict what scripts may execute in your page. 

This is a not a replacement for [escaping untrusted strings](#escape-html), but rather a secondary safety net. 

### Sanitize rich text

When user input can contain HTML (e.g. from a WYSIWYG editor), you cannot escape it for rendering.
You must instead sanitize it against a list of allowed tags, attributes and URL protocols.
-->

Callbacks {#callbacks}
------------------

Unpoly introduces new HTML attributes that can execute JavaScript code.\
These generally work like [`[onclick]`](https://www.w3schools.com/jsref/event_onclick.asp) or
[`[onload]`](https://www.w3schools.com/tags/ev_onload.asp) attributes in vanilla HTML.

```html
<a
  href="/path"
  up-follow
  up-on-loaded="console.log('Received response', response)"> <!-- mark: up-on-loaded -->
  Click link
</>

<form>
  <input
    type="text"
    name="title"
    up-watch="console.log('Field has new value', value)"> <!-- mark: up-watch -->
</form>
```

Some [response headers](up.protocol) can also contain callbacks encoded as a JSON string:

```http
Content-Type: text/html
X-Up-Open-Layer: { "mode": "drawer", "onDismissed": "console.log('Closed overlay', layer)" }
```

### What callbacks are allowed? {#callback-policy}

Unpoly will execute callbacks on a page without a CSP, or with a CSP that allows `unsafe-eval`.

You can configure a stricter behavior with `up.script.config.evalCallbackPolicy`:

| `evalCallbackPolicy` | Runs without CSP?  | Runs with CSP?     | Runs with CSP and [`<meta name="csp-nonce">`](#meta-csp-nonce)? |
|----------------------|--------------------|--------------------|-----------------------------------------------------------------|
| `'auto'` (default)     | Always             | ⚠️ With `unsafe-eval` | With allowed nonce                                              |
| `'pass'`               | Always             | ⚠️ With `unsafe-eval` | ⚠️ With `unsafe-eval`                                           |
| `'block'`              | Never              | Never              | Never                                                           |
| `'nonce'`              | With allowed nonce | With allowed nonce   | With allowed nonce                                              |


### Running callbacks with a strict CSP {#callback-with-strict-csp}

When your CSP doesn't allow `unsafe-eval`, callbacks like `[up-on-loaded]` will fail with an error like this:

```text
Uncaught EvalError: call to Function() blocked by CSP`
```

You can address this by [prefixing callback nonces](#callback-nonces)
or by [replacing callbacks with event listeners](#listener-for-callback).


### Restricting callbacks with nonces {#callback-nonces}

You can configure Unpoly to only run callbacks with an allowed nonce.
This allows you to selectively allow callbacks, even with a strict CSP.

```js
up.script.config.evalCallbackPolicy = 'nonce'
```

For Unpoly to be able to verify nonces, you must include a `<meta name="csp-nonce">` tag
in the `<head>` of the initial page load:

```html
<head>
  <meta name="csp-nonce" content="secret123"> <!-- mark: secret123 -->
  ...
</head>
```

Now only callbacks with a matching nonce will be executed:

```html
<a href="/path" up-on-loaded="nonce-secret123 console.log('Hi world')">
  ✔ Callback will run
</a>

<a href="/path" up-on-loaded="nonce-wrong789 console.log('Hi world')">
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


```js
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
| `'auto'` (default)      | Always             | If passes CSP      | With allowed nonce              |
| `'pass'`                | Always             | If passes CSP      | ⚠️ Always                       |
| `'block'`               | Never              | Never              | Never                           |
| `'nonce'`               | With allowed nonce | With allowed nonce | With allowed nonce              |


> [note]
> Configuration will only affect new fragments. The initial page load is solely governed by your CSP.


### Restricting script elements with nonces {#script-element-nonces}

If you want to be restrictive about `<script>` execution,
you can configure Unpoly to only run scripts with an allowed `[nonce]` attribute:

```js
up.script.config.scriptElementPolicy = 'nonce'
```

For Unpoly to be able to verify nonces, you must include a `<meta name="csp-nonce">` tag
in the `<head>` of the initial page load:

```html
<head>
  <meta name="csp-nonce" content="nonce-secret123"> <!-- mark: nonce-secret123 -->
  ...
</head>
```

Unpoly will now block any script without a matching nonce:

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

### Providing the document nonce to Unpoly {#meta-csp-nonce}

For Unpoly to be able to rewrite response nonces, you must include a `<meta name="csp-nonce">` tag
in the `<head>` of the initial page load:

```html
<head>
  <meta name="csp-nonce" content="nonce-secret123"> <!-- mark: nonce-secret123 -->
  ...
</head>
```

To provide the nonce through another method, configure `up.protocol.config.cspNonce()`.

### How responses are altered {#response-processing} 

```http
Content-Type: text/html
Content-Security-Policy: script-src 'self' 'nonce-match456'
...

<script nonce="match456">
  // ✔ Nonce will be rewritten to initial123
</script>

<script nonce="wrong789">
  // ❌ Nonce will NOT be rewritten
</script>
```

Note how responses in your HTML only need to match the response you're currently rendering.\
You do *not* need to track and re-use the nonce of the initial page load.


### Only `script-src` directives are supported

Unpoly's CSP parser has some limitations:

- When verifying responses, only the `script-src` directive is parsed.
- A `default-src` directive is parsed if no `script-src` directive is set.
- The `script-src-elem` and `script-src-attr` directives are not currently supported.
- Unpoly does not rewrite CSP nonces for non-script elements, such as stylesheets or images.


@page script-security
