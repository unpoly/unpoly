require 'json'
require 'fileutils'
require 'tmpdir'
require "active_support/all"

module Unpoly
  class Release
    class << self
      def version
        package_json_path = 'package.json'
        package_json_content = File.read(package_json_path)
        package_info = JSON.parse(package_json_content)
        package_info['version'].presence or raise Error, "Cannot parse { version } from #{package_json_path}"
      end

      def pre_release?
        version =~ /rc|beta|pre|alpha/
      end

      def run(command)
        system(command) or raise "Error running command: #{command}"
      end
    end
  end
end

namespace :release do

  desc 'Make a fresh production build'
  task :build do
    puts "Compiling a fresh build..."
    system 'npm run build' or raise "Could not build"
  end

  desc "Prompt user to confirm that they're ready"
  task :confirm do
    puts "You are about to release Unpoly version #{Unpoly::Release.version} to npm."
    puts
    puts "Before continuing, make sure the following tasks are done:"
    puts
    puts "- Bump the version in package.json"
    puts "- Update CHANGELOG.md"
    puts "- Commit and push changes"
    puts "- Make sure you're logged into npm"
    puts
    puts "Continuing will make a fresh build and publish a new version to npm."
    puts
    puts "Continue now? [y/N] "
    reply = STDIN.gets.strip.downcase
    unless reply == 'y'
      puts "Aborted."
      exit
    end
  end

  desc 'Remind user to update unpoly.com'
  task :remind_to_update_site do
    puts "Now remember to:"
    puts
    puts "- Make a new release to unpoly-rails with the same version"
    puts "- Update unpoly.com (unpoly-site) so users see the updated CHANGELOG and CDN link"
    puts "- Post an announcement about the new release to GitHub Discussions"
    puts "- Tweet a link to the CHANGELOG as @unpolyjs"
  end

  desc 'Publish package to npm'
  task :publish_to_npm do
    if Unpoly::Release.pre_release?
      puts 'Publishing a PRE-release'
      npm_tag = 'next'
    else
      npm_tag = 'latest'
    end

    staging_dir = 'tmp/npm-staging'
    FileUtils.mkpath(staging_dir)
    puts "Building NPM package in #{staging_dir}"
    # All contents of our package are either copied or symlinked in dist/.
    # This enables us to both to:
    #
    # (1) `npm publish` from a symlink-dereferenced copy of that folder.
    # (2) reference the dist folder as a local npm package during development.

    # Copy files in dist folder while following symbolic links
    Unpoly::Release.run("cp --recursive --dereference --force dist/* #{staging_dir}")
    Dir.chdir(staging_dir) do
      Unpoly::Release.run("npm publish --tag #{npm_tag}")
    end
  end

  desc 'Build artifacts, confirm with user and release to npm'
  task :process => [:build, :confirm, :publish_to_npm, :remind_to_update_site] do
  end

end
