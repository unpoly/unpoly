module Unpoly
  module Rails
    ##
    # This object allows the server to inspect the current request
    # for Unpoly-related concerns such as "is this a page fragment update?".
    #
    # Available through the `#up` method in all controllers, helpers and views.
    class Inspector
      include Memoized

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
      memoize def target
        request.headers['X-Up-Target'] || up_params['target']
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
      memoize def fail_target
        request.headers['X-Up-Fail-Target'] || up_params['fail-target']
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
      # [validated](https://unpoly.com/input-up-validate) (and not be saved to the database).
      def validate?
        validate_name.present?
      end

      ##
      # If the current form submission is a [validation](https://unpoly.com/input-up-validate),
      # this returns the name attribute of the form field that has triggered
      # the validation.
      memoize def validate_name
        request.headers['X-Up-Validate'] || up_params['validate']
      end

      ##
      # Forces Unpoly to use the given string as the document title when processing
      # this response.
      #
      # This is useful when you skip rendering the `<head>` in an Unpoly request.
      def title=(new_title)
        response.headers['X-Up-Title'] = new_title
      end

      memoize def context
        if json = context_json
          JSON.parse(json)
        end
      end

      def redirect_to(options, *args)
        if up?
          url = url_for(options)
          # Since our JS has no way to inject those headers into the redirect request,
          # we transport the headers over params.
          header_params = {
            'up[target]' => target,
            'up[fail-target]' => fail_target,
            'up[context]' => context_json
          }.compact
          url = append_params_to_url(url, header_params)
          controller.send(:redirect_to, url, *args)
        else
          controller.send(:redirect_to, options, *args)
        end
      end

      def request_url_without_up_params
        original_url = request.original_url

        if original_url =~ /\bup(\[|%5B])/
          uri = URI.parse(original_url)
          params = Rack::Utils.parse_query(uri.query)
          # We only used the up[...] params to transport headers, but we don't
          # want them to appear in a history URL.
          params = params.except('up[target]', 'up[fail-target]', 'up[context]')
          append_params_to_url(uri.path, params)
        else
          original_url
        end
      end

      private

      def append_params_to_url(url, params)
        if params.present?
          url = url.dup
          separator = url.include?('?') ? '&' : '?'
          url << separator
          url << params.to_query
        end
        url
      end

      def context_json
        request.headers['X-Up-Context'] || up_params['context']
      end

      attr_reader :controller

      delegate :request, :params, :response, to: :controller

      def up_params
        params['up'] || {}
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
