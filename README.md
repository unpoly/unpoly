[Unpoly 2](https://unpoly.com)
======

Unobtrusive JavaScript framework for server-side applications
-------------------------------------------------------------

[Unpoly](https://unpoly.com) enables fast and flexible frontends with minimal changes to your server-side code.

This repository is home to both the Unpoly 2 JavaScript code and its (optional) bindings for Ruby on Rails (`unpoly-rails` gem).

If you're looking for the code of Unpoly 0.x or 1.0, use the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable) branch.


Getting started
---------------

- See [unpoly.com](https://unpoly.com) for guides and documentation.
- See [installation instructions](https://unpoly.com/install) for many different package managers and languages.
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

- Install Ruby 2.3.8
- Install Bundler by running `gem install bundler`
- Install Node.js (required for building the library)
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

We are currently feeding two release channels:

- npm
- Rubygems (as the `unpoly-rails` gem)

We always release to all channel simultaneously.

To prepare a new version:

1. Edit `lib/unpoly/rails/version.rb` and bump the version number. Use [semantic versioning](http://semver.org/).
2. Add an entry to `CHANGELOG.md`
3. Commit and push the version bump and `CHANGELOG.md`
4. Log into Rubygems and npm

Now you can call `rake release:all` to publish to Rubygems and npm.

After you have published all release channels, remember to:

1. Update [unpoly.com](https://unpoly.com/) so users see the new version, CDN link and CHANGELOG.
2. Send a message to the [E-mail group](https://groups.google.com/group/unpoly) with the title "Unpoly X.Y.Z released". You can copy the relevant CHANGELOG part from [here](http://localhost:4567/changes_google_groups).


Credits
-------

- [Henning Koch](mailto:henning.koch@makandra.de) from [makandra](http://www.makandra.com) ([@triskweline](https://twitter.com/triskweline) on Twitter)

