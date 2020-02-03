module Unpoly
  module Rails
    class LayerInspector

      def initialize(inspector, mode:, context:)
        @inspector = inspector
        @mode = mode.presence || 'root'
        @context = context
      end

      attr_reader :mode
      attr_reader :context

      def overlay?
        not root?
      end

      def root?
        mode == 'root'
      end

      def emit(event_props)
        event_props[:layer] = 'current'
        inspector.emit(event_props)
      end

      def accept(value = nil)
        inspector.response.headers['X-Up-Accept-Layer'] = value.to_json
      end

      def dismiss(value = nil)
        inspector.response.headers['X-Up-Dismiss-Layer'] = value.to_json
      end

      private

      attr_reader :inspector

    end
  end
end