module Unpoly
  module Rails
    class Field

      def initialize(name)
        @name = name
      end

      attr_reader :name

      def header_name
        result = name.to_s
        result = result.gsub('_', '-')
        result = result.classify
        result= "X-Up-#{result}"
        result
      end

      def param_name(full: false)
        result = name.to_s
        result = result.dasherize
        result = "_up[#{result}]" if full
        result
      end

      def parse(raw)
        raise NotImplementedError
      end

      def stringify(value)
        raise NotImplementedError
      end

      private

      class String < Field

        def parse(raw)
          raw
        end

        def stringify(value)
          value
        end

      end

      class Hash < Field

        def parse(raw)
          if raw.present?
            hash = JSON.parse(raw)
          else
            hash = {}
          end

          ActiveSupport::HashWithIndifferentAccess.new(hash)
        end

        def stringify(value)
          JSON.generate(value)
        end

      end

    end

  end
end
