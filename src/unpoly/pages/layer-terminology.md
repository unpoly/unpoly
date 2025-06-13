Layer terminology
=================

Unpoly allows you to stack multiple pages on top of each other.
Each stack element is called a [*layer*](/up.layer).

The kind of layer (e.g. a modal dialog vs. a popup box) is called *mode*.

The initial page is called the *root layer*.
An *overlay* is any layer that is not the root layer.

Available modes
---------------

The mode of the initial page is `root`.

For overlays, the following modes are available:

@include overlay-modes-table

When [opening an overlay](/opening-overlays), you can pass an mode for the new overlay:

```html
<a href="/users/new/" up-layer="new drawer">
```

When no explicit mode is given, a `modal` overlay is opened. You can change this in `up.layer.config.mode`.

You may configure default attributes for each layer mode in `up.layer.config`.


See also
--------

- [Layer option](/layer-option) explains how to target another layer
- [Opening overlays](/opening-overlays) explains how to open overlays with different modes


@page layer-terminology
