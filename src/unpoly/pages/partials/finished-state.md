The following state is considered "finished":

- [Animations](/up.motion) have concluded and [transitioned](/up-transition) elements have been removed from the DOM tree.
- [Async compilers](/up.compiler#async) have settled.
- [Cached content](/caching) has been [revalidated with the server](/caching#revalidation).\
  If the server has responded with fresher content, that content has also been rendered.

@partial finished-state
