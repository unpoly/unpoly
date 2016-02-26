require "bundler/gem_tasks"
require 'sass/util'
require 'sass/script'
require 'sprockets/standalone'

module Unpoly
  module Assets
    MANIFESTS = %w(unpoly.js unpoly-bootstrap3.js unpoly.css unpoly-bootstrap3.css)
    SOURCES = %w(lib/assets/javascripts lib/assets/stylesheets)
    OUTPUT = 'dist'
  end
end

Sprockets::Standalone::RakeTask.new(:source_assets) do |task, sprockets|
  task.assets   = Unpoly::Assets::MANIFESTS
  task.sources  = Unpoly::Assets::SOURCES
  task.output   = Unpoly::Assets::OUTPUT
  task.compress = false
  task.digest   = false
  sprockets.js_compressor  = nil
  sprockets.css_compressor = nil
end

Sprockets::Standalone::RakeTask.new(:minified_assets) do |task, sprockets|
  task.assets   = Unpoly::Assets::MANIFESTS
  task.sources  = Unpoly::Assets::SOURCES
  task.output   = Unpoly::Assets::OUTPUT
  task.compress = false
  task.digest   = false
  sprockets.js_compressor  = :uglifier
  sprockets.css_compressor = :sass
end

namespace :assets do
  desc 'Compile assets for Bower and manual download'
  task :compile do
    Rake::Task['minified_assets:compile'].invoke
    Unpoly::Assets::MANIFESTS.each do |manifest|
      source = "dist/#{manifest}"
      target = "dist/#{manifest.sub(/\.([^\.]+)$/, '.min.\\1')}"
      File.rename(source, target)
    end
    Rake::Task['source_assets:compile'].invoke
  end
end
