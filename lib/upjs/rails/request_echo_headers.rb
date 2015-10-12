module Upjs
  module Rails
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
