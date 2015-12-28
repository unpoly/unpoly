module Upjs
  module Rails
    ##
    # This object allows the server to inspect the current request
    # for Up.js-related concerns such as "is this a page fragment update?".
    #
    # Available through the `#up` method in all controllers, helpers and views.
    class Inspector

      def initialize(controller)
        @controller = controller
      end

      ##
      # Returns whether the current request is an
      # [page fragment update](http://upjs.io/up.replace) triggered by an
      # Up.js frontend.
      def up?
        selector.present?
      end

      ##
      # If the current request is a [fragment update](http://upjs.io/up.replace),
      # this returns the CSS selector of the page fragment that should be updated.
      #
      # The Up.js frontend will expect an HTML response containing an element
      # that matches this selector. If no such element is found, an error is shown
      # to the user.
      #
      # Server-side code is free to optimize its response by only returning HTML
      # that matches this selector.
      def selector
        request.headers['X-Up-Selector']
      end

      ##
      # Returns whether the current form submission should be
      # [validated](http://upjs.io/up-validate) (and not be saved to the database).
      def validate?
        validate_name.present?
      end

      ###
      # If the current form submission is a [validation](http://upjs.io/up-validate),
      # this returns the name attribute of the form field that has triggered
      # the validation.
      def validate_name
        request.headers['X-Up-Validate']
      end

      private

      def request
        @controller.request
      end

      def params
        @controller.params
      end

    end
  end
end
