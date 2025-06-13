The topmost swappable element is the first child of the layer's container element:

- For the [root layer](/up.layer.root) it is the `<body>` element.
- For an overlay it is the `{ target }` that the overlay was opened with.
- If an overlay was opened with an explicit target, Unpoly will create a [main element](/up-main).
  This main element becomes the topmost swappable target.

@partial topmost-swappable-layer-element
