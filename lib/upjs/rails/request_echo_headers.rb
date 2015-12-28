module Upjs
  module Rails
    ##
    # Installs a before_filter into all controllers which echoes the
    # request's URL as a response header `X-Up-Location` and the request's
    # HTTP method as `X-Up-Method`.
    #
    # The Up.js frontend requires these headers to detect redirects,
    # which are otherwise undetectable for an AJAX client.
    module RequestEchoHeaders

      def self.included(base)
        base.before_filter :set_up_request_echo_headers
      end

      private
      
      def set_up_request_echo_headers
        headers['X-Up-Location'] = request.original_url
        headers['X-Up-Method'] = request.method
      end

      ActionController::Base.send(:include, self)

    end
  end
end
