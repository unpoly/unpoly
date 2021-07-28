Subinteractions
===============

Unpoly lets you use [overlays](/up.layer) to break up a complex screen into *subinteractions*.

Subinteractions take place in overlays and may span one or many pages. The original screen remains open in the background.
Once the subinteraction is *done*, the overlay is closed and a result value is communicated back to the parent layer.


Example
-------

Imagine a simple application that manages *projects* and *companies*:

- Each project is associated with a company.
- Each company may have multiple projects.
- The application has [CRUD interfaces](https://en.wikipedia.org/wiki/CRUD) for projects and companies.

The application could look like this:

![Screenshot of a CRUD interface](/images/api/crud-companies-projects.png){:width='500'}

The follow case illustrates the problems with a sequential screen flow:

- User starts filling out the form for a new project
- To create a project, the user must select a company. But the desired company does not yet exist.
- The user must abandon the half-completed project form to create the missing company.
  **All entered project data is lost**.
- When the company was created, the user returns to the project form.\
  All previously lost project data must be entered again.

We can improve this flow with a *subinteraction*:

- User starts filling out the form for a new project
- To create a project, the user must select a company. But the desired company does not yet exist.
- The user may *open an overlay* to create the missing company.\
  **The unfinished project form remains open in the background.**
- When the company was created in the overlay, the overlay should close.\
  The project form should now have the newly created company selected.

The diagram illustrates the difference between the two control flows:

![Differences between sequential screen flow and subinteractions](/images/api/subinteraction-flow.svg){:width='500'}


Starting a subinteraction
-------------------------

- Open an overlay with an [acceptance condition](/closing-overlays#close-conditions) and callback.
- When the condition is fulfilled, the overlay closes automatically, optionally with a [result value](/closing-overlays#overlay-result-values).
- The acceptance callback is called with the result value.
- The parent layer may change itself, e.g. by [reloading](/up.reload) a [fragment](/up.fragment)..

See [closing overlays](/closing-overlays) for an extensive explanation.


Common acceptance callbacks
---------------------------

\#\#\# Reloading on acceptance

A **common callback** is to reload an element in the parent layer:

```html
<a href="/companies/new"
  up-layer="new"
  up-accept-location="/companies/$id"
  up-on-accepted="up.reload('.company-list')">
  New company
</a>

<div class="company-list">
  ...
</div>
```

\#\#\# Adding options to an existing select

Another common callback reloads `<select>` options and selects the new foreign key.

```html
<select name="company">...</select>

<a href="/companies/new"
  up-layer="new"
  up-accept-location="/companies/$id"
  up-on-accepted="up.validate('select', { params: { company: value.id } })">
  New company
</a>
```

This example uses `up.validate()` to preview a form submission without persisting the results.


Reusing existing screens
------------------------

## Why this is useful

You already have a CRUD interaction for companies
You can now embed the existing company form into your project form

**The embedded interaction does not need to know when it's "done" or
what to do when it's done.** Instead the parent layer defines an
acceptance condition and callback action.



@page subinteractions
