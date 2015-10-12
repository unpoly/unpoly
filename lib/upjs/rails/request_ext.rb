module Upjs
  module Rails
    module Request

      def up?
        headers['X-Up-Selector'].present?
      end

      ActionDispatch::Request.send(:include, self)

    end
  end
end
