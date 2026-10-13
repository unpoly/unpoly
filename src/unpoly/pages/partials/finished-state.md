The following state is considered "finished":

- [Animations](/api/up.motion) have concluded and [transitioned](/api/up-transition) elements have been removed from the DOM tree.
- [Async compilers](/api/up.compiler#async) have settled.
- [Cached content](/learn/caching) has been [revalidated with the server](/learn/caching#revalidation).\
  If the server has responded with fresher content, that content has also been rendered.

@partial finished-state
