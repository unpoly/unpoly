defaults = up.navigation.defaults()

# BS use the class `active` to highlight the current section
# of a navigation bar.
up.navigation.defaults
  currentClasses: defaults.currentClasses.concat(['active'])
