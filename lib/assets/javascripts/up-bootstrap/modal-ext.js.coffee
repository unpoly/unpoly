# Use BS `modal-dialog` and `modal-content` classes.
# Also don't show a close button by default, since BS
# expects user to add this manually within the content block.
up.modal.defaults
  template: """
            <div class="up-modal">
              <div class="up-modal-dialog modal-dialog">
                <div class="up-modal-content modal-content"></div>
              </div>
            </div>
            """
