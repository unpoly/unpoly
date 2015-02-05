# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'upjs/rails/version'

Gem::Specification.new do |spec|
  spec.name          = "upjs-rails"
  spec.version       = Upjs::Rails::VERSION
  spec.authors       = ["Henning Koch"]
  spec.email         = ["henning.koch@makandra.de"]
  spec.description   = 'Snappy UI for server-side web applications'
  spec.summary       = spec.description
  spec.homepage      = ""
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_dependency 'rails', '>= 3'
  spec.add_development_dependency "bundler", "~> 1.3"
  spec.add_development_dependency "rake"
end
