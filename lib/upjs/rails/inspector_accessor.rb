module Upjs
  module Rails
    module InspectorAccessor

      def up
        @up_inspector ||= Inspector.new(self)
      end

      delegate :up?, :to => :up

      ActionController::Base.send(:include, self)

    end
  end
end
