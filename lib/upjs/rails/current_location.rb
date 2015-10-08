module Upjs
  module Rails
    module CurrentLocation

      def self.included(base)
        base.before_filter :set_header_for_current_location
      end

      private
      
      def set_header_for_current_location
        headers['X-Up-Location'] = request.original_url
        headers['X-Up-Method'] = request.method
      end

      ActionController::Base.send(:include, self)

    end
  end
end
