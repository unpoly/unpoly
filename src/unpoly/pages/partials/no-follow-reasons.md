- Links with an `[up-follow=false]` attribute. Also see [boolean attributes](/attributes-and-options#boolean-attributes).
- Links with a [`[download]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download) attribute.
- Links with a [`[target]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target) attribute (to target an iframe or open new browser tab).
- Links with a `javascript:`, `mailto:` or `tel:` scheme.
- Links with a cross-origin `[href]`.
- Links with an `[href="#"]` attribute that don't also have local HTML in an `[up-document]`, `[up-fragment]`, or `[up-content]` attribute.
- Any additional exceptions configured in `up.link.config.noFollowSelectors`.

@partial no-follow-reasons
