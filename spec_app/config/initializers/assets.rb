# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
Rails.application.config.assets.paths += Dir["#{Rails.root}/vendor/asset-libs/*"].sort_by { |dir| -dir.size }

# Precompile additional assets.
Rails.application.config.assets.precompile += %w( minimal_unpoly.js jasmine_extensions.js )
Rails.application.config.assets.precompile += %w( jasmine_style_mods.css )
Rails.application.config.assets.precompile += %w( integration_test.js integration_test.css )

# Precompile jQuery versions from jquery-rails individually, so we can include them as individual <script> tags
Rails.application.config.assets.precompile += %w( jquery.js jquery2.js jquery3.js )

# Precompile unpoly-migrate as a separate assets so we can run tests with and without it
Rails.application.config.assets.precompile += %w( unpoly-migrate.js )
