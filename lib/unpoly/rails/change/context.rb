module Unpoly
  module Rails
    class Change
      class Context

        def initialize(input, changes)
          # Response headers will only include changed keys
          @changes = ensure_indifferent_access(changes)

          # Keep a structure-cloned copy of the input hash, so we can
          # detect changes of sub-keys and sub-arrays in #finalize_changes.
          @input = ensure_indifferent_access(input)
          @unmutated_input = input.deep_dup
        end

        def [](key)
          if changes.key?(key)
            changes[key]
          else
            input[key]
          end
        end

        def delete(key)
          self[key] = nil
        end

        # Although we have mutation tracking in finalize_changes, we're still tracking
        # direct changes in #[]=. We don't want to force user code know whether to use
        # up.context[]= or up.fail_context[]=. Changes in either will be pushed to the
        # client in the X-Up-Context header.
        def []=(key, value)
          # No need to persist it through redirects (via params) anymore.
          input.delete(key)
          changes[key] = value
        end

        def to_h
          input.merge(changes)
        end

        def replace(new_hash)
          new_hash = new_hash.stringify_keys
          # The frontend merges X-Up-Context updates.
          # Hence we must nilify every key that no longer exists in the
          # replaced hash.
          deleted_keys = (input.keys | changes.keys) - new_hash.keys
          changes.replace(new_hash)
          deleted_keys.each { |deleted_key| changes[deleted_key] = nil }
          input.clear
          unmutated_input.clear
        end

        def finalize_changes
          unmutated_input.each do |key, unmutated_value|
            if input.key?(key) && !changes.key?(key)
              input_value = input[key]
              if unmutated_value != input_value
                self[key] = input_value
              end
            end
          end
        end

        private

        attr_reader :input, :unmutated_input, :changes

        def ensure_indifferent_access(hash)
          if hash.is_a?(ActiveSupport::HashWithIndifferentAccess)
            hash
          else
            raise "Constructor args must be an ActiveSupport::HashWithIndifferentaccess"
          end
        end

      end
    end
  end
end
