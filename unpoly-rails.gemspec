lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'unpoly/rails/version'
require 'unpoly/tasks'

Gem::Specification.new do |spec|
  spec.name          = "unpoly-rails"
  spec.version       = Unpoly::Rails::VERSION
  spec.authors       = ["Henning Koch"]
  spec.email         = ["henning.koch@makandra.de"]
  spec.description   = 'Rails bindings for Unpoly, the unobtrusive JavaScript framework'
  spec.summary       = spec.description
  spec.homepage      = "https://unpoly.com"
  spec.license       = "MIT"
  spec.files         = Dir['lib/**/*.rb'] + %w[LICENSE README.md README_RAILS.md CHANGELOG.md .yardopts] + Unpoly::Tasks.dist_paths
  spec.executables   = []
  spec.test_files    = []
  spec.require_paths = %w[lib dist]

  spec.add_dependency 'rails', '>= 3.2'
  spec.add_dependency 'memoized'
  spec.add_development_dependency "bundler", "~> 1.3"
  spec.add_development_dependency "rake"

  # We use Module#prepend (2.1)
  # We use the safe navigation operator (2.3)
  spec.required_ruby_version = '>= 2.3.0'
end
