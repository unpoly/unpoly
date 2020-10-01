module Unpoly
  module Rails
    class Change
      class Cache

        def initialize(change)
          @change = change
        end

        # TODO: Docs
        def clear
          change.cache_command = 'clear'
        end

        private

        attr_reader :change

      end
    end
  end
end
