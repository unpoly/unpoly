lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

require 'sass/util'
require 'sass/script'
require 'sprockets/standalone'
require 'unpoly/rails/version'
require 'unpoly/tasks'
require 'json'
require 'fileutils'
require 'tmpdir'

namespace :gem do
  require "bundler/gem_tasks"

  task :explain_frozen_shell do
    puts 'Publishing to rubygems.org. If this seems to freeze, enter your 2FA token.'
  end

  Rake::Task['gem:build'].enhance ['assets:build']

  Rake::Task['gem:release:rubygem_push'].enhance ['gem:explain_frozen_shell']
end

namespace :sprockets do
  Sprockets::Standalone::RakeTask.new(:source_assets) do |task, sprockets|
    task.assets   = Unpoly::Tasks::SPROCKETS_MANIFESTS
    task.sources  = Unpoly::Tasks::SPROCKETS_SOURCES
    task.output   = Unpoly::Tasks::SPROCKETS_OUTPUT_FOLDER
    task.compress = false
    task.digest   = false
    sprockets.js_compressor  = nil
    sprockets.css_compressor = nil
  end

  Sprockets::Standalone::RakeTask.new(:minified_assets) do |task, sprockets|
    task.assets   = Unpoly::Tasks::SPROCKETS_MANIFESTS
    task.sources  = Unpoly::Tasks::SPROCKETS_SOURCES
    task.output   = Unpoly::Tasks::SPROCKETS_OUTPUT_FOLDER
    task.compress = false
    task.digest   = false
    sprockets.js_compressor  = :uglifier
    sprockets.css_compressor = :sass
  end

  Rake::Task['sprockets:minified_assets:compile'].enhance do
    # Remove any fingerprints from build files and add a ".min" infix.
    Unpoly::Tasks::SPROCKETS_MANIFESTS.each do |manifest|
      source = "dist/#{manifest}"
      target = "dist/#{manifest.sub(/\.([^\.]+)$/, '.min.\\1')}"
      File.rename(source, target)
    end
  end
end

namespace :assets do

  desc 'Clean unpoly assets'
  task :clean do
    FileUtils.rm Unpoly::Tasks.dist_paths
  end

  desc 'Build unpoly assets into dist dfolder'
  task :build => :clean do
    Rake::Task['sprockets:minified_assets:compile'].invoke
    Rake::Task['sprockets:source_assets:compile'].invoke

    # Since we're calling Sprockets twice and rename files the
    # manifest.json doesn't contain useful mappings anymore.
    FileUtils.rm 'dist/manifest.json'

    Rake::Task['assets:validate'].invoke
  end

  desc 'Validate build files in dist folder'
  task :validate do
    Unpoly::Tasks.dist_paths.each do |dist_path|
      unless File.exists?(dist_path)
        raise "Expected build file to exist: #{dist_path}"
      end

      content = File.read(dist_path)

      if content.size == 0
        raise "Zero-byte build file: #{dist_path}"
      end

      if content =~ /\beval\b/
        raise "`eval` found in build file: #{dist_path}"
      end
    end
  end
end

namespace :release do

  desc "Prompt user to confirm that they're ready"
  task :confirm do
    puts "You are about to release Unpoly version #{Unpoly::Rails::VERSION}"
    puts "Before publishing new Unpoly version:"
    puts "- Bump the version in version.rb"
    puts "- Update the CHANGELOG"
    puts "Ready to publish? [y/N] "
    reply = STDIN.gets.strip.downcase
    unless reply == 'y'
      puts "Aborted"
      exit
    end
  end

  desc 'Remind user to update unpoly.com'
  task :remind_to_update_site do
    puts "Now remember to:"
    puts "- update unpoly.com so user see the updated CHANGELOG and CDN link"
    puts "- send a message to the e-mail group announcing the new release"
    puts "- tweet a link to the CHANGELOG as @unpolyjs"
  end

  desc 'Build artifacts, push to git and release to package managers'
  task :all => [:confirm, 'gem:release', 'npm:release', :remind_to_update_site] do
  end

end

namespace :npm do

  desc 'Ensure that package.json contains the correct { version }'
  task :sync_package_json do
    data = File.read(Unpoly::Tasks::NPM_MANIFEST)
    json = JSON.load(data)

    # Sanity-check the parsed JSON
    json['version'] or raise 'No { version } property found in package.json'

    version_changed = json['version'] != Unpoly::Rails::VERSION

    if version_changed
      json['version'] = Unpoly::Rails::VERSION
      data = JSON.pretty_generate(json)
      File.write(Unpoly::Tasks::NPM_MANIFEST, data)

      Unpoly::Tasks.run("git add #{Unpoly::Tasks::NPM_MANIFEST}")
      Unpoly::Tasks.run("git commit -m 'Update package.json with version #{Unpoly::Rails::VERSION}'")
      Unpoly::Tasks.run("git push")
    end
  end

  desc 'Publish package to NPM'
  task :release => ['assets:build', :sync_package_json] do
    if Unpoly::Tasks.pre_release?
      puts 'Publishing a PRE-release'
      npm_tag = 'next'
    else
      npm_tag = 'latest'
    end

    staging_dir = 'tmp/npm-staging'
    FileUtils.mkpath(staging_dir)
    puts "Building NPM package in #{staging_dir}"
    # Copy files in dist folder while following symbolic links
    Unpoly::Tasks.run("cp --recursive --dereference --force dist/* #{staging_dir}")
    Dir.chdir(staging_dir) do
      Unpoly::Tasks.run("npm pack")
      # Unpoly::Tasks.run("npm publish --tag #{npm_tag}")
    end
  end

end
