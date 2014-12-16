up.magic = (function() {

  function newBehavior(options) {

    var registered = [];
    var installed = [];

    var behavior = function() {
      var description = options.register(arguments);
      if (description) {
        registered.push(description);
      }
    };

    behavior.install = function() {
      var outerArgs = arguments;
      up.util.each(registered, function(description) {
        var args = [description] + outerArgs;
        var description = options.install.apply(this, args);
        if (description) {
          installed.push(description);
        }
      });
    };

    behavior.uninstall = function() {
      var description;
      while (description = installed.pop()) {
        options.uninstall.apply(this, arguments);
      }
    };

    return behavior;

  }

  function newBehaviorRegistry() {

    var timeout = newBehavior({

      register: function(delay, callback) {
        return {
          delay: delay,
          callback: callback
        }
      },

      install: function(description) {
        return setTimeout(description.callback, description.delay);
      },

      uninstall: window.clearTimeout

    });

    var interval = newBehavior({

      register: function(delay, callback) {
        return {
          delay: delay,
          callback: callback
        }
      },

      install: function(description) {
        return setInterval(description.callback, description.delay);
      },

      uninstall: window.clearInterval

    });

//    var once = newBehavior({
//
//      register: function(callback) {
//        return { callback: callback };
//      },
//
//      install: function(description) {
//        description.callback();
//        return false;
//      }
//
//    });

    var live = newBehavior({

      register: function(events, selector, callback) {
        var apiTranslator = function(event) {
          callback.apply(this, [event, $(this)])
        };
        return {
          events: events,
          selector: selector,
          callback: apiTranslator
        }
      },

      install: function(description) {
        $(document).on(description.events, description.selector, description.callback);
        return description;
      },

      uninstall: function(description) {
        $(document).off(description.events, description.selector, description.callback);
      }

    });

    var element = newBehavior({

      register: function(selector, callback) {
        return {
          selector: selector,
          callback: callback
        }
      },

      install: function($element, description) {
        $element.find(description.selector).addBack().each(function() {
          description.callback.apply(this, [$(this)])
        });
        return false;
      }

    });

    return {
      element: element,
      on: live,
      timeout: timeout,
      interval: interval
//      once: once
    }

  }

  var app = newBehaviorRegistry();
  var page = newBehaviorRegistry();

  up.bus.on('app:ready', function() {
    app.timeout.install();
    app.interval.install();
    app.selector.install();
    up.bus.emit('fragment:ready', $(document.body))
  });

  up.bus.on('page:hibernate', function() {
    page.selector.uninstall();
    page.timeout.uninstall();
    page.interval.uninstall();
    // don't need to uninstall element behavior since we will discard the elements anyway
  });

  up.bus.on('fragment:ready', function($fragment) {
    app.element.install($fragment);
    page.element.install($fragment);
    page.selector.install();
    page.timeout.install();
    page.interval.install();
  });

  return {
    app: newBehaviorRegistry(),
    page: newBehaviorRegistry()
  }

})();
