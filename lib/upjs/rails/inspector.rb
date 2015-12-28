module Upjs
  module Rails
    class Inspector

      def initialize(controller)
        @controller = controller
      end

      def up?
        selector.present?
      end

      def validate?
        request.headers['X-Up-Validate'].present?
      end

      def selector
        request.headers['X-Up-Selector']
      end

      private

      def request
        @controller.request
      end

      def params
        @controller.params
      end

    end
  end
end
