  ###**
  Layer terminology
  =================

  Unpoly allows you to stack multiple pages on top of each other.
  Each stack element is called a [*layer*](/up.layer).

  The kind of layer (e.g. a modal dialog vs. a popup box) is called *mode*.

  The initial page is called the *root layer*.
  An *overlay* is any layer that is not the root layer.

  Available modes
  --------------

  | Mode      | Description                           | Overlay? |
  | --------- | ------------------------------------- |----------|
  | `root`    | The initial page                      | no       |
  | `modal`   | A modal dialog box                    | yes      |
  | `drawer`  | A drawer sliding in from the side     | yes      |
  | `popup`   | A popup menu anchored to a link       | yes      |
  | `cover`   | An overlay covering the entire screen | yes      |

  The default mode for [new overlays](/a-up-layer-new) is `modal`.
  You can change this in `up.layer.config.mode`.

  You may configure default attributes for each layer mode in `up.layer.config`.

  @page layer-terminology
  ###