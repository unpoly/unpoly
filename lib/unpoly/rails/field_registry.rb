module Unpoly
  module Rails
    module FieldRegistry

      def self.included(base)
        base.extend ClassMethods
      end

      delegate :request_fields, to: :class

      module ClassMethods
        def request_fields
          @request_fields ||= []
        end

        def request_field(name, type)
          field = type.new(name)

          request_fields << field

          memoize define_method(name) {
            request_field_value(field)
          }
        end
      end

    end
  end
end