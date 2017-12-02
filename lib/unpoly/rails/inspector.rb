module Unpoly
  module Rails
    ##
    # This object allows the server to inspect the current request
    # for Unpoly-related concerns such as "is this a page fragment update?".
    #
    # Available through the `#up` method in all controllers, helpers and views.
    class Inspector

      def initialize(controller)
        @controller = controller
      end

      ##
      # Returns whether the current request is an
      # [page fragment update](https://unpoly.com/up.replace) triggered by an
      # Unpoly frontend.
      def up?
        target.present?
      end

      alias_method :unpoly?, :up?

      ##
      # Returns the CSS selector for a fragment that Unpoly will update in
      # case of a successful response (200 status code).
      #
      # The Unpoly frontend will expect an HTML response containing an element
      # that matches this selector.
      #
      # Server-side code is free to optimize its successful response by only returning HTML
      # that matches this selector.
      def target
        request.headers['X-Up-Target']
      end

      ##
      # Returns the CSS selector for a fragment that Unpoly will update in
      # case of an failed response. Server errors or validation failures are
      # all examples for a failed response (non-200 status code).
      #
      # The Unpoly frontend will expect an HTML response containing an element
      # that matches this selector.
      #
      # Server-side code is free to optimize its response by only returning HTML
      # that matches this selector.
      def fail_target
        request.headers['X-Up-Fail-Target']
      end

      ##
      # Returns whether the given CSS selector is targeted by the current fragment
      # update in case of a successful response (200 status code).
      #
      # Note that the matching logic is very simplistic and does not actually know
      # how your page layout is structured. It will return `true` if
      # the tested selector and the requested CSS selector matches exactly, or if the
      # requested selector is `body` or `html`.
      #
      # Always returns `true` if the current request is not an Unpoly fragment update.
      def target?(tested_target)
        query_target(target, tested_target)
      end

      ##
      # Returns whether the given CSS selector is targeted by the current fragment
      # update in case of a failed response (non-200 status code).
      #
      # Note that the matching logic is very simplistic and does not actually know
      # how your page layout is structured. It will return `true` if
      # the tested selector and the requested CSS selector matches exactly, or if the
      # requested selector is `body` or `html`.
      #
      # Always returns `true` if the current request is not an Unpoly fragment update.
      def fail_target?(tested_target)
        query_target(fail_target, tested_target)
      end

      ##
      # Returns whether the given CSS selector is targeted by the current fragment
      # update for either a success or a failed response.
      #
      # Note that the matching logic is very simplistic and does not actually know
      # how your page layout is structured. It will return `true` if
      # the tested selector and the requested CSS selector matches exactly, or if the
      # requested selector is `body` or `html`.
      #
      # Always returns `true` if the current request is not an Unpoly fragment update.
      def any_target?(tested_target)
        target?(tested_target) || fail_target?(tested_target)
      end

      ##
      # Returns whether the current form submission should be
      # [validated](https://unpoly.com/up-validate) (and not be saved to the database).
      def validate?
        validate_name.present?
      end

      ##
      # If the current form submission is a [validation](https://unpoly.com/up-validate),
      # this returns the name attribute of the form field that has triggered
      # the validation.
      def validate_name
        request.headers['X-Up-Validate']
      end

      ##
      # Forces Unpoly to use the given string as the document title when processing
      # this response.
      #
      # This is useful when you skip rendering the `<head>` in an Unpoly request.
      def title=(new_title)
        response.headers['X-Up-Title'] = new_title
      end

      private

      def request
        @controller.request
      end

      def params
        @controller.params
      end

      def response
        @controller.response
      end

      def query_target(actual_target, tested_target)
        if up?
          if actual_target == tested_target
            true
          elsif actual_target == 'html'
            true
          elsif actual_target == 'body'
            not ['head', 'title', 'meta'].include?(tested_target)
          else
            false
          end
        else
          true
        end
      end

    end
  end
end
