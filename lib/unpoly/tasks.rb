require 'unpoly/rails/version'

module Unpoly
  module Tasks
    SPROCKETS_MANIFESTS = %w(
      unpoly.js
      unpoly.css
      unpoly-migrate.js
      unpoly-bootstrap3.js
      unpoly-bootstrap3.css
      unpoly-bootstrap4.js
      unpoly-bootstrap4.css
      unpoly-bootstrap5.js
      unpoly-bootstrap5.css
    )

    SPROCKETS_SOURCES = %w(lib/assets/javascripts lib/assets/stylesheets)

    SPROCKETS_OUTPUT_FOLDER = 'dist'

    NPM_MANIFEST = 'package.json'

    # VISIBLE_TASKS = %w(
    #   publish:build
    #   publish:clean
    #   publish:commit
    #   publish:release
    #   publish:all
    # )

    module_function

    def pre_release?
      Unpoly::Rails::VERSION =~ /rc|beta|pre|alpha/
    end

    def dist_paths
      Dir["#{SPROCKETS_OUTPUT_FOLDER}/**/*.{js,css}"]
    end

    def run(command)
      system(command) or raise "Error running command: #{command}"
    end
  end
end
