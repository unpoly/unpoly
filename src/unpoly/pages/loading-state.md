Loading state
=============

Unpoly offers many tools to instantly show loading state after a user interaction.

By quickly signaling that the app is working, you can make your interface appear more responsive.


Styling active elements
-----------------------



(There is an example on up.status, but maybe leave nav/up-current out of it)

- Links with .up-active
- Forms with .up-active (form, origin element, submit button)
- Targeted element gets .up-loading


Showing placeholders
--------------------

- Example
- See /placeholders



Arbitrary status effects
------------------------

You can do arbitrary status effects or event optimistic rendering.

Use previews.



Disabling forms while working
------------------------------

- Both feedback and a safeguard against concurrent input.



Global progress bar
-------------------

- Built-in progress bar
- Custom progress bars possible


Signaling severe network problems
---------------------------------

Unpoly provides events to handle network issues like disconnects or flaky connections:

```js
up.on('up:fragment:offline', function(event) { // mark-phrase "up:fragment:offline"
  if (confirm('You are offline. Retry?')) event.retry()
})
```

See [Handling network issues](/network-issues) for details and examples.



@page loading-state
