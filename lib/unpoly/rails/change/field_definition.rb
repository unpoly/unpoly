module Unpoly
  module Rails
    class Change
      module FieldDefinition

        def self.included(base)
          base.extend ClassMethods
        end

        delegate :fields, to: :class

        module ClassMethods

          def field(name, type)
            field = type.new(name)

            define_method "#{name}_field" do
              field
            end

            define_method "#{name}_from_request_headers" do
              raw_value = request.headers[field.header_name]
              field.parse(raw_value)
            end

            define_method "#{name}_param_name" do
              field.param_name
            end

            define_method "serialized_#{name}" do
              value = send(name)
              field.stringify(value)
            end

            # define_method "#{name}_from_response_headers" do
            #   raw_value = response.headers[field.header_name]
            #   field.parse(raw_value)
            # end

            define_method "#{name}_from_params" do
              raw_value = params[field.param_name]
              field.parse(raw_value)
            end

            define_method "#{name}_from_request" do
              value = send("#{name}_from_request_headers")
              if value.nil?
                value = send("#{name}_from_params")
              end
              value
            end

            define_method "write_#{name}_to_response_headers" do
              value = send(name)
              response.headers[field.header_name] = field.stringify(value)
            end
          end

        end
      end
    end
  end
end
