module Unpoly
  module Rails
    ##
    # This object allows the server to inspect the current request
    # for Unpoly-related concerns such as "is this a page fragment update?".
    #
    # Available through the `#up` method in all controllers, helpers and views.
    class Change
      include Memoized
      include FieldRegistry

      def initialize(controller)
        @controller = controller
        @events = []
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
      request_field :target, Field::String

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
        test_target(target, tested_target)
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
      request_field :fail_target, Field::String

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
        test_target(fail_target, tested_target)
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
        validate.present?
      end

      ##
      # If the current form submission is a [validation](https://unpoly.com/input-up-validate),
      # this returns the name attribute of the form field that has triggered
      # the validation.
      request_field :validate, Field::String

      alias :validate_name :validate

      ##
      # TODO: Docs
      request_field :mode, Field::String

      ##
      # TODO: Docs
      request_field :fail_mode, Field::String

      ##
      # TODO: Docs
      request_field :mode, Field::String

      ##
      # TODO: Docs
      request_field :context, Field::Hash

      ##
      # TODO: Docs
      request_field :fail_context, Field::Hash

      ##
      # TODO: Docs
      def emit(type, options = {})
        # Track the given props in an array. If the method is called a second time,
        # we can re-set the X-Up-Events header with the first and second props hash.
        event_plan = { type: type, options: options }
        @events.push(event_plan)
        headers['X-Up-Events'] = @events.to_json
      end

      ##
      # Forces Unpoly to use the given string as the document title when processing
      # this response.
      #
      # This is useful when you skip rendering the `<head>` in an Unpoly request.
      def title=(new_title)
        response.headers['X-Up-Title'] = new_title
      end

      def url_with_request_values(url)
        append_params_to_url(url, request_fields_as_params)
      end

      # Used by RequestEchoHeaders to prevent up[...] params from showing up
      # in a history URL.
      def request_url_without_up_params
        original_url = request.original_url

        if original_url =~ /\b_up(\[|%5B)/
          uri = URI.parse(original_url)

          # This parses the query as a flat list of key/value pairs, which
          # in this case is easier to work with than a nested hash.
          params = Rack::Utils.parse_query(uri.query)

          # We only used the up[...] params to transport headers, but we don't
          # want them to appear in a history URL.
          non_up_params = params.reject { |key, _value| key.starts_with?('_up[') }

          append_params_to_url(uri.path, non_up_params)
        else
          original_url
        end
      end

      private

      attr_reader :controller

      delegate :request, :params, :response, to: :controller

      def request_field_value(field)
        raw_value = request_value_from_headers(field) || request_value_from_params(field)
        field.parse(raw_value)
      end

      def request_value_from_params(field)
        if up_params = params['_up']
          name = field.param_name
          up_params[name]
        end
      end

      def request_value_from_headers(field)
        request.headers[field.header_name]
      end

      def request_fields_as_params
        pairs = request_fields.map { |field|
          value = send(field.name)
          [field.param_name(full: true), field.stringify(value)]
        }
        params = pairs.to_h
        params = params.select { |_key, value| value.present? }
        params
      end

      def test_target(actual_target, tested_target)
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

      def append_params_to_url(url, params)
        if params.blank?
          url
        else
          separator = url.include?('?') ? '&' : '?'
          [url, params.to_query].join(separator)
        end
      end

    end
  end
end
