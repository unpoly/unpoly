# Up.js: Snappy UI for server-side web applications

Up.js gives your traditional web application fast-responding views with minimal changes to your code and development style. If you require modern UX but don't want to pay the Javascript MVC complexity tax, Up.js can be a solution for you.

See [upjs.io](http://upjs.io) for more information and API documentation.


## Running tests

Overview:

- This currently requires Ruby
- There's a Rails app in `spec_app`
- Jasmine tests live in `spec_app/spec/javascripts`
- There are also some Cucumber integration tests left in `spec_app/features`, but this is legacy code.
  Testing with Jasmine works so well that we want the entire test suite to become pure-JS Jasmine specs.
 
To run Jasmine tests:
 
- Install Ruby 2.1.2
- `cd` into `spec_app`
- Install dependencies by running `bundle install`
- Migrate
- Start the Rails server
- Access `http://localhost:3000/specs`


## Making a new release

We are currently feeding three release channels:

- Manual download from Github
- Bower
- Rubygems (as the `upjs-rails` gem)

To make a new release:

- Edit `lib/upjs/rails/version.rb` and bump the version number. Use [semantic versioning](http://semver.org/).
- Commit and push the version bump
- From the project root, type `rake assets:compile`. This will output minified JS and CSS files to the `dist` folder.
- Commit and push the generated files
- From the project root, type `rake release`. This will publish a new gem version to Rubygems.org.
  It will also push a tag for this version, which Bower requires for its own versioning scheme.

Always run `rake assets:compile` before `rake release` so the git tag points to the correct commit (required for Bower versioning).
