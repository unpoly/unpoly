function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

var divs = document.querySelectorAll('div');
divs = Array.prototype.slice.call(divs)
divs = shuffle(divs)


performance.mark('array-start')

collection = []
for (var i = 0; i < divs.length; i++) {
  collection.push(divs[i])
}

performance.mark('array-end')


performance.mark('jquery-start')

$collection = $([])
for (var i = 0; i < divs.length; i++) {
  $collection = $collection.add(divs[i])
}

performance.mark('jquery-end')


performance.measure('array', 'array-start', 'array-end')
performance.measure('jquery', 'jquery-start', 'jquery-end')

console.log(up.util.last(performance.getEntriesByName('array')))
console.log(up.util.last(performance.getEntriesByName('jquery')))

performance.clearMarks();
performance.clearMeasures();
