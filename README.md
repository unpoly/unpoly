Unpoly + Rails bindings
======================

Unpoly gives your traditional web application fast-responding views with minimal changes to your code and development style. If you require modern UX but don't want to pay the Javascript complexity tax, Unpoly can be a solution for you.

This repository is home both to the Unpoly javascript code and its (optional) bindings for Ruby on Rails (`upjs-rails` gem).


Getting started
---------------

- See [unpoly.com](http://unpoly.com) for more information and Javascript API documentation.
- See [`CHANGELOG.md`](https://github.com/makandra/upjs/blob/master/CHANGELOG.md) for notable changes.
- See [`README_RAILS.md`](https://github.com/makandra/upjs/blob/master/README_RAILS.md) documentation of the Rails bindings.


Running tests
-------------

Overview:

- This currently requires Ruby
- There's a Rails app in `spec_app`
- Jasmine tests for Unpoly live in `spec_app/spec/javascripts`
- RSpec tests for the `upjs-rails` gem live in `spec_app/spec/controllers`

Install dependencies for tests:

- Install Ruby 2.1.2
- Install Bundler by running `gem install bundler`
- `cd` into `spec_app`
- Install dependencies by running `bundle install`

To run Jasmine tests for Unpoly:

- `cd` into `spec_app`
- Start the Rails server by running `rails server`
- Access `http://localhost:3000/specs` to see the Jasmine test runner

To run RSpec tests for the `upjs-rails` gem:

- `cd` into `spec_app`
- Run `rspec`


Making a new release
--------------------

We are currently feeding three release channels:

- Manual download from Github
- Bower (this also fetches from Github)
- Rubygems (as the `upjs-rails` gem)

We always release to all channel simultaneously.

To make a new release:

- Edit `lib/upjs/rails/version.rb` and bump the version number. Use [semantic versioning](http://semver.org/).
- Add an entry to `CHANGELOG.md`
- Commit and push the version bump and `CHANGELOG.md`
- From the project root, type `rake assets:compile`. This will output minified JS and CSS files to the `dist` folder.
- Commit and push the generated files in `dist`
- From the project root, type `rake release`. This will publish a new gem version to Rubygems.org.
  It will also push a tag for this version, which Bower requires for its own versioning scheme.

Always run `rake assets:compile` before `rake release` so the git tag points to the correct commit (required for Bower versioning).
