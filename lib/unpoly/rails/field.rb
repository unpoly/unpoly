# module Unpoly
#   module Rails
#     class Field
#
#       def initialize(name, type = :string)
#         @name = name
#         @type = type
#       end
#
#       def header_name
#         name = name.gsub('_', '-')
#         name = name.classify
#         name = "X-Up-#{name}"
#         name
#       end
#
#       def param_name(full: false)
#         name = name.to_s
#         name = name.dasherize
#         name = "up[#{name}]" if full
#         name
#       end
#
#       def self.string(name)
#         String.new(name, :string)
#       end
#
#       def self.hash(name)
#         new(name, :hash)
#       end
#
#       def parse(raw)
#         raise NotImplementedError
#       end
#
#       def stringify(value)
#         raise NotImplementedError
#       end
#
#       private
#
#       attr_reader :name, :type
#
#       class String < Field
#
#         def parse(raw)
#           raw
#         end
#
#         def stringify(value)
#           value
#         end
#
#       end
#
#       class Hash < Field
#
#         def parse(raw)
#           if raw.present?
#             hash = JSON.parse(raw)
#           else
#             hash = raw
#           end
#
#           ActiveSupport::HashWithIndifferentAccess.new(hash)
#         end
#
#         def stringify(value)
#           JSON.generate(value)
#         end
#
#       end
#
#     end
#
#   end
# end
