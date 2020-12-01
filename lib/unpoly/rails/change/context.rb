module Unpoly
  module Rails
    class Change
      class Context

        def initialize(original, changes)
          @original = original
          @changes = changes
        end

        attr_reader :original, :changes

        def [](key)
          if @changes.key?(key)
            @changes[key]
          else
            @original[key]
          end
        end

        def []=(key, value)
          @changes[key] = value
        end

        def to_h
          original.merge(changes)
        end

      end
    end
  end
end
