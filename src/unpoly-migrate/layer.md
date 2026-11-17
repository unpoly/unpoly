# up.layer

@namespace up.layer

-----

# [up-close]

When this element is clicked, closes a currently open overlay.

Does nothing if no overlay is currently open.

To make a link that closes the current overlay, but follows to
a fallback destination on the root layer:

    <a href="/fallback" up-close>Okay</a>

@selector [up-close]
@deprecated
  Use `[up-dismiss]` instead.
