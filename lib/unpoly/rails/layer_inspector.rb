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
      def root?
        mode == 'root'
      end

      ##
      # TODO: Docs
      def emit(event_props)
        event_props[:layer] = 'current'
        inspector.emit(event_props)
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