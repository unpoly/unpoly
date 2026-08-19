// Applies the runner's `spec` filter, replacing the one Jasmine's HTML boot installs.
//
// Two reasons to own it:
//
// (1) It is repeatable. `bin/test --spec=a --spec=b`, and every --file, resolve to a list
//     of full names, and the run is their union. Jasmine's filter takes one string and
//     escapes "|", so an alternation cannot express this.
//
// (2) Matching is verbatim. Jasmine's filter builds a RegExp; it does escape the
//     metacharacters, so a title like "[up-target]" already works — but nothing about
//     that is guaranteed, and 39% of our titles contain metacharacters. String.includes()
//     cannot drift.
//
// A spec runs if *any* filter is a substring of its full name, so filters may overlap
// freely: naming a group and one of its specs is not a contradiction, and cannot run
// anything twice.
let filters = specs.config.spec || []
if (!Array.isArray(filters)) filters = [filters]
filters = filters.filter((filter) => filter !== '')

if (filters.length) {
  jasmine.getEnv().configure({
    specFilter: (spec) => filters.some((filter) => spec.getFullName().includes(filter))
  })
}
