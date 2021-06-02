module Unpoly
  module Rails
    class Engine < ::Rails::Engine
      initializer 'unpoly-rails.assets' do |app|
        # The gem package has a dist folder with the pre-built unpoly.js/.css.
        # The folder may be empty in the local repository, or contain a stale build.
        dist_folder = root.join('dist')

        # The local repository has a lib/assets folder, but the gem package does not.
        # The Rails asset pipeline can require unpoly.js/.css from there and compile
        # it within the Rails process.
        source_folder = root.join('lib', 'assets')

        is_local_gem = source_folder.directory?

        # If someone has required the local gem (e.g. `gem 'unpoly', path: '../unpoly'`)
        # we use the local path. This way changes in the source are immediately picked
        # up by the application.
        if is_local_gem
          app.config.assets.paths << source_folder.join('javascripts').to_s
          app.config.assets.paths << source_folder.join('stylesheets').to_s
        else
          app.config.assets.paths << dist_folder.to_s
        end
      end
    end
  end
end
