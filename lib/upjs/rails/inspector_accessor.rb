module Upjs
  module Rails
    ##
    # This adds two methods `#up` and `#up?` to all controllers,
    # helpers and views, allowing the server to inspect the current request
    # for Up.js-related concerns such as "is this a page fragment update?".
    module InspectorAccessor

      def self.included(base) # :nodoc:
        base.helper_method :up, :up?
      end

      def up
        @up_inspector ||= Inspector.new(self)
      end

      ##
      # :method: up?
      # Returns whether the current request is an
      # [page fragment update](http://upjs.io/up.replace) triggered by an
      # Up.js frontend.
      delegate :up?, :to => :up

      ActionController::Base.send(:include, self)

    end
  end
end
