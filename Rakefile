require "bundler/gem_tasks"
require 'sprockets/standalone'

module Upjs
  module Assets
    MANIFESTS = %w(up.js up.css)
    SOURCES = %w(lib/assets/javascripts lib/assets/stylesheets)
    OUTPUT = 'dist'
  end
end

Sprockets::Standalone::RakeTask.new(:source_assets) do |task, sprockets|
  task.assets   = Upjs::Assets::MANIFESTS
  task.sources  = Upjs::Assets::SOURCES
  task.output   = Upjs::Assets::OUTPUT
  task.compress = false
  task.digest   = false
  sprockets.js_compressor  = nil
  sprockets.css_compressor = nil
end

Sprockets::Standalone::RakeTask.new(:minified_assets) do |task, sprockets|
  task.assets   = Upjs::Assets::MANIFESTS
  task.sources  = Upjs::Assets::SOURCES
  task.output   = Upjs::Assets::OUTPUT
  task.compress = false
  task.digest   = false
  sprockets.js_compressor  = :uglifier
  sprockets.css_compressor = :sass
end

namespace :assets do
  task :compile do
    Rake::Task['minified_assets:compile'].invoke
    File.rename('dist/up.js', 'dist/up.min.js')
    File.rename('dist/up.css', 'dist/up.min.css')
    Rake::Task['source_assets:compile'].invoke
  end
end
