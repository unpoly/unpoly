up.api = (function() {

  function rememberSource($element) {
    $element.attr('up-source', location.href);
  }

  function recallSource($element) {
    var url;
    var $source = $element.closest('[up-source]');
    if ($source.length) {
      url = $source.attr('up-source')
    } else {
      url = location.href;
    }
    return url;
  }

  function replace(targetSelector, url, substituteSelector) {
    if (!substituteSelector) {
      substituteSelector = targetSelector;
    }
    var $target = $(targetSelector);
    if ($target.length == 0) {
      $target = up.util.$createElementFromSelector(targetSelector);
    }
    $target.addClass('up-loading');
    up.util.get(url).done(function(html) {
      $target.removeClass('up-loading');
      var $html = $(html);
      var $substitute = $html.find(substituteSelector);
      if ($substitute.length) {
        $target.replaceWith($substitute);
        var title = $html.filter('title').text();
        document.title = title;
        up.past.push(url);
        // Remember where the element came from so we can make
        // smaller page loads in the future (does this even make sense?).
        rememberSource($target);
      } else {
        error('Could not find selector (' + substituteSelector + ') in response (' + html + ')')
      }
    });
  }

  function error(message) {
    alert(message);
    throw message;
  }

  function reload(selector) {
    replace(selector, recallSource($(selector)));
  }

  function remove(elementOrSelector) {
    $(elementOrSelector).remove();
  }

  $(document).on('click', 'a[up-target]', function(event) {
//    event.stopPropagation();
//    event.preventDefault();
    var url = $(this).attr('href');
    var selector = $(this).attr('up-target');
    replace(selector, url);
    return false;
  });

  return {
    replace: replace,
    reload: reload,
    remove: remove
  }

})();
