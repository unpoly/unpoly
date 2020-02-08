module Unpoly
  module Rails
    class Change
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
              result = ActiveSupport::JSON.decode(raw)
            else
              result = {}
            end

            if result.is_a?(Hash)
              result = ActiveSupport::HashWithIndifferentAccess.new(result)
            end

            result
          end

          def stringify(value)
            ActiveSupport::JSON.encode(value)
          end

        end

      end

    end
  end
end
