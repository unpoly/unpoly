  ###**
  Customizing overlays
  ====================

  Understanding the HTML structure
  --------------------------------

  The various [overlay modes](/up.layer.mode) have an HTML structure like this:

  ```html
  <up-modal size="medium">                     <!-- container with attributes -->
    <up-modal-backdrop></up-modal-backdrop>    <!-- semi-transparent background -->
    <up-modal-viewport>                        <!-- scroll bar -->
      <up-modal-box>                           <!-- white box with padding -->
        <up-modal-content>...</div>            <!-- content parent (unstyled) -->
        <up-modal-dismiss>×</up-modal-dismiss> <!-- dismiss icon -->
      </up-modal-box>
    </up-modal-viewport>
  </up-modal>
  ```

  For drawers and cover modals replace the `<up-modal>` elements with `<up-drawer>` or `<up-cover>` accordingly.

  Popups have a simpler markup as they don't have a backdrop, scroll bar or dismiss icon:

  ```html
  <up-popup size="medium" position="bottom" align="left">
    <up-popup-box>
      <up-popup-content>...</div>
    </up-popup-box>
  </up-popup>
  ```


  Customizing overlays with CSS
  -----------------------------

  Unpoly ships with some basic CSS styles for the various overlay modes.

  You may override Unpoly's default styles in your CSS:

  ```css
  up-modal-box {
    background-color: #eeeeee;
    padding: 20px;
  }
  ```

  You may also style overlays with a particular property.
  E.g. the following selector would only match the box of a right-aligned popup:

  ```css
  up-popup[align=right] up-popup-box {
    ...
  }
  ```


  Overlay size
  ------------

  When opening an overlay you may pass an `[up-size]` attribute or `{ size }` option that give the overlay a width:

  ```html
  <a href="/path" up-layer="new" up-size="small">open small modal</a>
  <a href="/path" up-layer="new" up-size="medium">open medium modal</a>
  <a href="/path" up-layer="new" up-size="large">open large modal</a>
  <a href="/path" up-layer="new" up-size="auto">open growing modal</a>
  ```

  If you don't pass a size you get a `medium` overlay.

  Sizes set a maximum width for the overlay's box element (e.g. `<up-modal-box>`). The default widths are:

  | Mode   | small | medium | large  | grow |
  | -------| -----:| ------:| ------:|-----------------|
  | `modal`  | `350px` | `650px` | `1000px` | grow with content |
  | `popup`  | `180px` | `300px` | `550px`  | grow with content |
  | `drawer` | `150px` | `340px` | `600px`  | grow with content |
  | `cover`  | `100%`  | `100%`  | `100%`   | `100%` |

  You can customize sizes with CSS:

  ```css
  up-modal[size=medium] up-modal-box {
    width: 500px;
  }
  ```

  Regardless of size, overlays never grow wider than the screen width.


  Overlay classes
  ---------------

  Overlays are currently limited to the built-in overlay modes.

  You may however make a variant of an existing mode, by passing an `[up-class]` attribute or `{ class }` option
  when opening an overlay:

  ```html
  <a href="/confirm-erase"
     up-method="delete"
     up-layer="new"
     up-class="warning">
    Erase disk
  </a>
  ```

  The class will be assigned to the overlay's container element:

  ```html
  <up-modal class="warning">
  ...
  </up-modal>
  ```

  You can now style "warning modals" in your CSS:

  ```css
  up-modal.warning up-modal-box {
    background-color: yellow
  }
  ```


  Customizing overlay elements
  ----------------------------

  The overlay HTML structure is static and cannot be changed through an option.

  If you need to customize the overlay elements, you may use the `up:layer:opened` event.
  The event is emitted after the overlay was inserted into the DOM, but before it is
  being rendered by the browser.

  ```js
  up.on('up:layer:opened', function(event) {
    if (isChristmas()) {
      up.element.affix(event.layer.element, '.santa-hat', text: 'Merry Christmas!')
    }
  })
  ```

  Make sure to not remove any of the existing overlay elements or things will break.


  Customizing dismiss controls
  ----------------------------

  By default the user can dismiss an overlay user by pressing `Escape`, by clicking outside the overlay box
  or by pressing an "X" icon in the top-right corner.

  You may [customize the dismiss controls](/closing-overlays#user-dismiss-controls)
  available to the user.


  Popup position
  --------------

  By default popups will open below the link that opened it (the `{ origin }`).
  You may control the position of the popup relative to the origin by assigning
  `[up-position]` and `[up-align]` attributes to the opening link. When opening
  an overlay with JavaScript, use `{ position, align }` options.

  The following combinations are supported:

  | `{ position }` | `{ align }` | Effect                                                  |
  |----------------|-------------|---------------------------------------------------------|
  | `top`          | `left`      | Popup sits above the origin. Left edges align.          |
  | `top`          | `right`     | Popup sits above the origin. Right edges align.         |
  | `top`          | `center`    | Popup sits above the origin. Horizontal centers align.  |
  | `bottom`       | `left`      | Popup sits below the origin. Left edges align.          |
  | `bottom`       | `right`     | Popup sits below the origin. Right edges align.         |
  | `bottom`       | `center`    | Popup sits below the origin. Horizontal centers align.  |
  | `left`         | `top`       | Popup sits left to the origin. Top edges align          |
  | `left`         | `bottom`    | Popup sits left to the origin. Bottom edges align.      |
  | `left`         | `center`    | Popup sits left to the origin. Vertical centers align.  |
  | `right`        | `top`       | Popup sits right to the origin. Top edges align.        |
  | `right`        | `bottom`    | Popup sits right to the origin. Bottom edges align.     |
  | `right`        | `center`    | Popup sits right to the origin. Vertical centers align. |

  ###
