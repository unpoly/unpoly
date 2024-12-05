Loading state
=============

After a user interaction, Unpoly offers many methods to provide instant feedback while waiting for the network.

This increases the perceived responsiveness of your application.


Styling active elements
-----------------------

(There is an example on up.feedback, but maybe leave nav/up-current out of it)

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
