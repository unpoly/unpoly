Working with Content Security Policies
======================================

This guide shows how address issues with a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (or  CSP). 


Attribute callbacks {#attribute-callbacks}
------------------------------------------

When your CSP disallows `eval()`, Unpoly cannot directly run JavaScript code in HTML attributes. This affects `[up-on-...]` attributes like [`[up-on-loaded]`](/up-follow#up-on-loaded) or [`[up-on-accepted]`](/up-layer-new#up-on-accepted).

For example, the following callback would crash the fragment update with an error like `Uncaught EvalError: call to Function() blocked by CSP`:

```html
<a href="/path" up-follow up-on-loaded="alert()">Click me</a>
```

There are several solutions to this.


### <em class="heading-prefix">Option 1</em> Move the callback into your JavaScript {#attribute-to-compiler}

One solution is to move the handler from the HTML to the JavaScript file that we loaded via an allowed `<script src>`.

In the example above we could invent a new `.alert-on-loaded` class that we assign to the link:

```html
<a href="/path" up-follow class="alert-on-loaded">Click me</a>
```

Then this JavaScript listener intercepts clicks on elements with that class:

```javascript
up.on('up:link:follow', '.alert-on-loaded', (event) => {
  event.renderOptions.onLoaded = () => alert()
})
```


### <em class="heading-prefix">Option 2</em> Prefix a CSP nonce {#nonceable-attributes}

Unpoly lets you work around this by prefixing your callback with a [CSP nonce](https://content-security-policy.com/nonce/):

```html
<a href="/path" up-follow up-on-loaded="nonce-kO52Iphm8B alert()">Click me</a>
```

The `nonce-` prefix is static, followed by your random nonce in Base64, followed by a space and your original JavaScript code.

> [note]
> Prefixing nonces only works for `[up-on...]` attributes. You cannot use it for native HTML attributes like `[onclick]`.

The embedded nonce must match a `script-src` nonce of the response that you're currently rendering:

```http
Content-Type: text/html
Content-Security-Policy: script-src 'self' 'nonce-kO52Iphm8B'
...

<a href="/path" up-follow up-on-loaded="nonce-kO52Iphm8B alert()">Click me</a>
```

When the nonces from the HTML and the response header match, Unpoly will [rewrite the HTML to the document's nonce](#nonce-rewriting).



Inline scripts {#scripts}
-------------------------

By default `<script>` tags will only run during the initial page load.
Scripts in updated fragments will *not* be loaded or executed.
If possible, [migrate these scripts to a compiler](/legacy-scripts#migrate-to-compiler). That compiler can then be moved into a
global script that satisfies your CSP:

```js
<html>
  <head>
    <script src="/compilers.js" defer></script> <!-- mark: /compilers.js -->
  </head>
  <body>
    ...
  </body>
</html>
```

If you absolutely want to run scripts in new fragments, you can change the default:

```js
up.fragment.config.runScripts = true // default is false
```

This will work as long as a script satisfies your CSP, e.g. by matching an allowed nonce or hostname.


### Nonce-based CSPs {#scripts-nonce}

With a [nonce-based CSP](https://content-security-policy.com/nonce/) make sure that any `<script nonce>` attribute
matches the `script-src` of the response you're currently rendering:

```http
Content-Type: text/html
Content-Security-Policy: script-src 'self' 'nonce-kO52Iphm8B'
...

<script nonce="kO52Iphm8B">
  console.log("Hello from inline script")
</script>
```

When the nonces from the HTML and the response header match, Unpoly will Unpoly will [rewrite the HTML to the document's nonce](#nonce-rewriting).


### CSPs with `strict-dynamic` {#scripts-strict-dynamic}

A CSP with [`strict-dynamic`](https://content-security-policy.com/strict-dynamic/) allows any allowed script
to load additional scripts. Because Unpoly is already an allowed script,
this would allow *any* Unpoly-rendered script to execute.

To prevent this, Unpoly requires [matching CSP nonces](#scripts-nonce) in any response with a `strict-dynamic` CSP, even with `up.fragment.config.runScripts = true`.

If you cannot use nonces for some reasons, you can configure `up.fragment.config.runScripts` to a function
that returns `true` for allowed scripts only:

```js
up.fragment.config.runScripts = (script) => {
  return script.src.startsWith('https://myhost.com/')
}
```

This would allow any script from a `myhost.com` host, even without a matching nonce.



Fragment nonces are rewritten {#nonce-rewriting}
------------------------------------------------

When the initial document is rendered, its CSP header contains the only valid nonce for the lifetime of that document. 
When new fragments are loaded and inserted, their HTML may contain new, random nonces that won't
match the document. Nonces that don't match the document cannot be used to allowlist active content.

To ensure that new fragments contain valid nonces, Unpoly will rewrite the new fragment's HTML
so all nonces match those from the initial document. This is *only* done when the fragment's nonces match the
`script-src` directive from its own response.

This can be convenient to you as a developer.
Nonces in your HTML only need to match the response you're currently rendering.
You do *not* need to track and re-use the nonce of the initial document.

### Providing the document nonce to Unpoly {#providing-document-nonce}

For Unpoly to able to rewrite response nonces, you must include a `<meta name="csp-nonce">` tag
in the `<head>` of the initial page that [booted](/up.boot) Unpoly:

```html
<head>
  <meta name="csp-nonce" content="nonce-kO52Iphm8B"> <!-- mark: nonce-kO52Iphm8B -->
  ...
</head>
```

Because Unpoly [rewrites new fragments](#nonce-rewriting) so their nonces matches the document,
you never need to update the `<meta>` tag with the latest nonce.

To provide the nonce through another method, configure `up.protocol.config.cspNonce`.

### Only `style-src` directives are supported

When verifying responses, only the `style-src` directive is parsed.
A `default-src` directive is parsed if no `script-src` directive is set.

The `script-src-elem` and `script-src-attr` directives are not currently supported.

Unpoly does not rewrite CSP nonces for non-script elements, such as stylesheets or images.



@page csp
@menu-title Content Security Policy
