module Unpoly
  module Rails
    ##
    # Installs a `before_action` into all controllers which echoes the
    # request's URL as a response header `X-Up-Location` and the request's
    # HTTP method as `X-Up-Method`.
    #
    # The Unpoly frontend requires these headers to detect redirects,
    # which are otherwise undetectable for an AJAX client.
    module RequestEchoHeaders

      def self.included(base)
        if base.respond_to?(:before_action)
          base.before_action :set_up_request_echo_headers
        else
          base.before_filter :set_up_request_echo_headers
        end
      end

      private
      
      def set_up_request_echo_headers
        response.headers['X-Up-Location'] = up.request_url_without_up_params
        response.headers['X-Up-Method'] = request.method
      end

      ActionController::Base.send(:include, self)

    end
  end
end
