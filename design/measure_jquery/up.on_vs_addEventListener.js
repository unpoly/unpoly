u = up.util

element = document.body
callback = function() { }


for (var i = 0; i < 10000; i++) {
  if (i == 1000) {
    performance.mark('up-start')
  }
  element.addEventListener('click', callback)
  element.removeEventListener('click', callback)
}

performance.mark('up-end')




for (var i = 0; i < 10000; i++) {
  if (i == 1000) {
    performance.mark('native-start')
  }
  element.addEventListener('click', callback)
  element.removeEventListener('click', callback)
}

performance.mark('native-end')



$element = jQuery(element)

for (var i = 0; i < 10000; i++) {
  if (i == 1000) {
    performance.mark('jquery-start')
  }
  $element.on('click', callback)
  $element.off('click', callback)
}

performance.mark('jquery-end')




performance.measure('native', 'native-start', 'native-end')
performance.measure('up', 'up-start', 'up-end')
performance.measure('jquery', 'jquery-start', 'jquery-end')

console.log(u.last(performance.getEntriesByName('native')))
console.log(u.last(performance.getEntriesByName('up')))
console.log(u.last(performance.getEntriesByName('jquery')))

performance.clearMarks();
performance.clearMeasures();
