module Unpoly
  module Rails
    ##
    # This adds two methods `#up` and `#up?` to all controllers,
    # helpers and views, allowing the server to inspect the current request
    # for Unpoly-related concerns such as "is this a page fragment update?".
    module Controller

      def self.prepended(base)
        base.helper_method :up, :up?, :unpoly, :unpoly?
        if base.respond_to?(:after_action)
          base.after_action { up.after_action }
        else
          base.after_filter { up.after_action }
        end
      end

      ##
      # TODO: Docs
      def up
        @up_change ||= Change.new(self)
      end

      alias_method :unpoly, :up

      ##
      # :method: up?
      # Returns whether the current request is an
      # [page fragment update](https://unpoly.com/up.replace) triggered by an
      # Unpoly frontend.
      delegate :up?, :unpoly?, to: :up

      ##
      # TODO: Docs
      def redirect_to(target, *args)
        if up?
          target = url_for(target)
          target = up.url_with_field_values(target)
        end
        super(target, *args)
      end

      ActionController::Base.prepend(self)

    end
  end
end
