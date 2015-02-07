module Upjs
  module Rails
    module CurrentLocation

      def self.included(base)
        base.before_filter :set_header_for_current_location
      end

      private
      
      def set_header_for_current_location
        headers['X-Up-Current-Location'] = request.fullpath
      end

      ActionController::Base.include(self)

    end
  end
end
