Unpoly + Rails bindings
=======================

Unpoly gives your traditional web application fast-responding views with minimal changes to your code and development style. If you require modern UX but don't want to pay the Javascript complexity tax, Unpoly can be a solution for you.

This repository is home both to the Unpoly javascript code and its (optional) bindings for Ruby on Rails (`unpoly-rails` gem).


Getting started
---------------

- See [unpoly.com](http://unpoly.com) for more information and Javascript API documentation.
- See [`CHANGELOG.md`](https://github.com/unpoly/unpoly/blob/master/CHANGELOG.md) for notable changes.
- See [`README_RAILS.md`](https://github.com/unpoly/unpoly/blob/master/README_RAILS.md) documentation of the Rails bindings.


Development
-----------

### Running tests

Overview:

- This currently requires Ruby
- There's a Rails app in `spec_app`
- Jasmine tests for Unpoly live in `spec_app/spec/javascripts`
- RSpec tests for the `unpoly-rails` gem live in `spec_app/spec/controllers`

Install dependencies for tests:

- Install Ruby 2.1.2
- Install Bundler by running `gem install bundler`
- `cd` into `spec_app`
- Install dependencies by running `bundle install`

To run Jasmine tests for Unpoly:

- `cd` into `spec_app`
- Start the Rails server by running `rails server`
- Access `http://localhost:3000/specs` to see the Jasmine test runner

To run RSpec tests for the `unpoly-rails` gem:

- `cd` into `spec_app`
- Run `rspec`


### Making a new release

We are currently feeding fourrelease channels:

- Manual download from Github
  NPM
- Bower (which is based on Git and version tags)
- Rubygems (as the `unpoly-rails` gem)

We always release to all channel simultaneously.

To make a new release:

1. Edit `lib/unpoly/rails/version.rb` and bump the version number. Use [semantic versioning](http://semver.org/).
2. Add an entry to `CHANGELOG.md`
3. Commit and push the version bump and `CHANGELOG.md`
4. From the project root, type `rake publish:build`. This will output minified JS and CSS files to the `dist` folder. It also updates the `package.json` for NPM.
5. Commit and push the generated files. There is a rake task `rake publish:commit` that helps with this.
6. From the project root, type `rake publish:release`. This will publish a new gem version to Rubygems.org.
7. It will also push a tag for this version, which Bower requires for its own versioning scheme. Finally it publishes to NPM.

Always remember to build, commit and push build artifacts before calling `rake publish:release` so the Git tag points to the correct commit.

If you have done this process a few times and know what you're doing, you can call `rake publish:all` to run all these steps in sequence. 


Credits
-------

- [Henning Koch](mailto:henning.koch@makandra.de) from [makandra](http://www.makandra.com) ([@triskweline](https://twitter.com/triskweline) on Twitter)

