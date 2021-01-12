module Unpoly
  module Rails
    class Change
      class Cache

        def initialize(change)
          @change = change
        end

        # TODO: Docs
        def clear(pattern = '*')
          change.clear_cache = pattern
        end

        def keep
          clear(false)
        end

        private

        attr_reader :change

      end
    end
  end
end
