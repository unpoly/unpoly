module Upjs
  module Rails
    module Redirection

      def redirect_to(*args)
        super
        flash[:redirected_to] = self.location if request.up?
      end

      def self.included(base)
        base.before_filter :extract_redirect_location
      end

      private

      def extract_redirect_location
        if location = flash[:redirected_to]
          headers['X-Up-Previous-Redirect-Location'] = location
        end
      end

      ActionController::Base.include(self)

    end
  end
end
