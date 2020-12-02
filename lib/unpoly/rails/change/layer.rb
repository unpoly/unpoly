module Unpoly
  module Rails
    class Change
      class Layer
        class CannotClose < Error; end

        def initialize(change, mode:, context:)
          @change = change
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
        def emit(type, options = {})
          change.emit(type, options.merge(layer: 'current'))
        end

        ##
        # TODO: Docs
        def accept(value = nil)
          overlay? or raise CannotClose, 'Cannot accept the root layer'
          change.response.headers['X-Up-Accept-Layer'] = value.to_json
        end

        ##
        # TODO: Docs
        def dismiss(value = nil)
          overlay? or raise CannotClose, 'Cannot dismiss the root layer'
          change.response.headers['X-Up-Dismiss-Layer'] = value.to_json
        end

        private

        attr_reader :change

      end
    end
  end
end