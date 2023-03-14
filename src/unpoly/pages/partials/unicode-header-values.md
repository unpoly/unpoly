> [important]
> HTTP headers [may only contain US-ASCII (7-bit) characters](https://www.rfc-editor.org/rfc/rfc7230#section-3.2.4).
> If you have higher code points in a JSON value, you may
> [encode those characters using Unicode escape sequences](https://makandracards.com/makandra/536174-http-headers-can-only-transport-us-ascii-characters-safely).

@partial unicode-header-values
