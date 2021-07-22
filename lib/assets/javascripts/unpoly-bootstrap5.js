// Bootstrap uses the class `active` to highlight the current section
// of a navigation bar.
up.feedback.config.currentClasses.push('active');

up.feedback.config.navSelectors.push('.nav', '.navbar');

up.viewport.config.fixedTop.push('.navbar.fixed-top');
up.viewport.config.fixedBottom.push('.navbar.fixed-bottom');
up.viewport.config.anchoredRight.push('.navbar.fixed-top', '.navbar.fixed-bottom');

// We would really like to provide a nice default for up.form.config.validateTargets.
// Unfortunately Bootstrap 5 no longer has a selector like ".form-group" to group labels
// and inputs. All the examples now use <div class="mb-3"> .

up.fragment.config.badTargetClasses.push(
  'row',
  /^col(-xs|-sm|-md|-lg|-xl|-xxl)?(-\d+)?$/,
  /^[mp][tbsexy]?-\d+$/
);

require('../stylesheets/unpoly-bootstrap5.sass');
