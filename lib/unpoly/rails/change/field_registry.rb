module Unpoly
  module Rails
    class Change
      module FieldRegistry

        def self.included(base)
          base.extend ClassMethods
        end

        delegate :fields, :request_fields, :response_fields, to: :class

        module ClassMethods
          def fields
            request_fields + response_fields
          end

          def request_fields
            @request_fields ||= []
          end

          def response_fields
            @response_fields ||= []
          end

          def request_field(name, type)
            field = type.new(name)

            request_fields << field

            memoize define_method(name) {
              request_field_value(field)
            }
          end

          def response_field(name, type)
            field = type.new(name)

            response_fields << field

            memoize define_method(name) {
              response_field_value(field)
            }
          end

        end
      end
    end
  end
end
