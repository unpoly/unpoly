module Unpoly
  module Rails
    ##
    # This adds two methods `#up` and `#up?` to all controllers,
    # helpers and views, allowing the server to inspect the current request
    # for Unpoly-related concerns such as "is this a page fragment update?".
    module InspectorAccessor

      def self.included(base)
        base.helper_method :up, :up?
      end

      def up
        @up_inspector ||= Inspector.new(self)
      end

      alias_method :unpoly, :up

      ##
      # :method: up?
      # Returns whether the current request is an
      # [page fragment update](https://unpoly.com/up.replace) triggered by an
      # Unpoly frontend.
      delegate :up?, :unpoly?, :to => :up

      ActionController::Base.send(:include, self)

    end
  end
end
