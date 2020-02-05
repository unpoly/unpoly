module Unpoly
  module Rails
    class LayerInspector

      def initialize(inspector, mode:, context:)
        @inspector = inspector
        @mode = mode.presence || 'root'
        @context = context
      end

      ##
      # TODO: Docs
      attr_reader :mode

      ##
      # TODO: Docs
      attr_reader :context

      ##
      # TODO: Docs
      def overlay?
        not root?
      end

      ##
      # TODO: Docs
      # TODO: Test that this returns "root" for a non-Unpoly request
      def root?
        mode == 'root'
      end

      ##
      # TODO: Docs
      def emit(type, options = {})
        inspector.emit(type, options.merge(layer: 'current'))
      end

      ##
      # TODO: Docs
      def accept(value = nil)
        inspector.response.headers['X-Up-Accept-Layer'] = value.to_json
      end

      ##
      # TODO: Docs
      def dismiss(value = nil)
        inspector.response.headers['X-Up-Dismiss-Layer'] = value.to_json
      end

      private

      attr_reader :inspector

    end
  end
end