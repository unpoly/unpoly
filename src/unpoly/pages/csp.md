Working with strict Content Security Policies
=============================================

When your [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) disallows `eval()`, Unpoly cannot directly run JavaScript code in HTML attributes. This affects `[up-on-...]` attributes like [`[up-on-loaded]`](/a-up-follow#up-on-loaded) or [`[up-on-accepted]`](/a-up-layer-new#up-on-accepted).

For example, the following callback would crash the fragment update with an error like `Uncaught EvalError: call to Function() blocked by CSP`:

```html
<a href="/path" up-follow up-on-loaded="alert()">Click me</a>
```

This page outlines several solutions for this.


### Solution 1: Move the callback into your JavaScript

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


### Solution 2: Prefix a CSP nonce

Unpoly lets you work around this by prefixing your callback with a [CSP nonce](https://content-security-policy.com/nonce/):

```html
<a href="/path" up-follow up-on-loaded="nonce-kO52Iphm8B alert()">Click me</a>
```

The `nonce-` prefix is static, followed by your random nonce in Base64, followed by a space and your original JavaScript code.

The embedded nonce must match a `script-src` nonce of the response that you're currently rendering:

```http
Content-Type: text/html
Content-Security-Policy: script-src 'self' 'nonce-kO52Iphm8B'
...

<a href="/path" up-follow up-on-loaded="nonce-kO52Iphm8B alert()">Click me</a>
```

For this to work you must also include the `<meta name="csp-nonce">` tag in the `<head>` of the initial page that [booted](/up.boot) Unpoly:

```html
<head>
  <meta name="csp-nonce" content="nonce-kO52Iphm8B">
  ...
</head>
```

To provide the nonce through another method, configure `up.protocol.config.cspNonce`.

When responding to a fragment update, you may use a CSP nonce unique to that latest response.
You do *not* need to reuse the nonce of the initial page that booted Unpoly. Neither to you need to update the `<meta>` tag with the latest nonce.


### Solution 3: Relax your CSP

Depending on your requirements, you may decide to prioritize developer convenience over a strict CSP.

You can use all `[up-on-]` attributes without restriction by passing the `'unsafe-eval'` directive:

```http
Content-Security-Policy: script-src 'self' 'unsafe-eval'
```

Note that this allows the use of `eval()` from all allowed scripts on your page, not just from Unpoly. However, it does not allow the creation of inline `<script>` tags.

@page csp
