```js
up.on('up:assets:changed', function() {
  // If we are already showing a notification, do nothing.
  if (document.querySelector('#new-version')) return
   
  // Append a <div id="new-version"> notification to the <body>
  up.element.affix(document.body, '#new-version', {
    text: 'A new app version is available. Click to reload.',
    onclick: () => location.reload()
  })
})
```

@partial new-asset-notification-example
