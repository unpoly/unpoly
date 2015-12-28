findSelector = (selector, $origin) ->

  $match = undefined
  
  if u.isPresent($origin)
    $match ||= filterFirstReal($origin.find(selector))
    $match ||= filterFirstReal($origin.closest(selector))
    $match ||= filterFirstReal($origin.closest('form').find(selector))
    
  $match ||= filterFirstReal($(".up-popup #{selector}"))
  $match ||= filterFirstReal($(".up-modal #{selector}"))
  $match ||= filterFirstReal($(selector))
  
  $match
    
        


[1] Präferiert $origin selbst
[2] Präferiert ein direkter Nachfahr von $origin
[3] ein direkter Vorfahr von $origin
[4] Präferiert im gleichen <form> von $origin
[5] Präferiert in .up-modal
[6] Präferiert in .up-popup
[7] Sonst irgendwo im Dokument



first(".up-popup #{selector}") ||
  first(".up-modal #{selector}") ||
  first(selector) ||
  fragmentNotFound(selector)














Vielleicht Mittelding aus Variante 3 + hinterlegte

Wie gehe ich damit um, dass .form-group nicht unique ist?

    form.submit(origin: '[name=email]')
    
Oder in den CSS-Selektor mit Custom Selector? input[name=email]^^.form-group

Oder kann ich bei elementFromSelector schlauer sein?

Oder das hier passiert nicht mit replace?



Variante 3: up-validate definiert Control-Gruppe
================================================

HTML
----

    <form>

      <div class="form-group">
        <label>E-mail</label>
        <input type="text" name="email" up-validate=".form-group:has(&)" />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="text" name="password" up-validate="& < .form-group" />
      </div>
      
    </form>

Con:
----
So kann ich up-validate nicht mehr für change/input verwenden, oder vielleicht mal die URL zu benennen
Das könnten dann aber auch andere Attribute sein.

Pro:
----
Das wäre vielleicht auch eine Lösung für das Selects-Visibility-For Problem:

    <form>

      <div class="form-group">
        <label>Public card</label>
        <input type="checkbox" name="is_public" up-validate=".form-group, .confidential" />
      </div>

      <% if @form.object.is_public? %>
        <div class="form-group confidential">
          <label>Confidentiality</label>
          <input type="text" name="confidential" up-validate=".form-group" />
        </div>
      <% end %>
      
    </form>



Implementierung
---------------

    createSelectorFromElement = ($element) ->
      id = $element.attr("id")
      upId = $element.attr("up-id")
      name = $element.attr("name")
      if present(upId)
        selector = "[up-id='#{upId}']"
      else if present(id)
        selector = "##{id}" + id  if present(id)
      else if present(name)
        tagName = $element.prop("tagName").toLowerCase()
        selector = "#{tagName}[name='#{name}']"
      else
        error('...')
      selector

    isGoodSelector = (selector) ->
      u.contains(selector, '#') || u.contains(selector, '[name=]')

    enhanceSelector = (selector, $origin) ->
      unless isGoodSelector(selector)
        $form = $origin.closest('form')
        selector = "#{u.selectorFromElement($form)}:has(#{selector})"
      selector

    validate = (elementOrSelector, options) ->
      $input = $(elementOrSelector)
      closestGroupSelector = u.option(u.presence($input.attr('up-validate')), config.groups, 'form')
      $group = $start.closest(closestGroupSelector)
      $form = $group.closest('form')
      $validateFlag = $('<input type="hidden" name="up-validate" value="1" >')
      $validateFlag.appendTo($form)

      groupSelector = u.createSelectorFromElement($group)
      groupSelector = enhanceSelector(groupSelector)
      
      up.submit($form, target: groupSelector, failTarget: groupSelector)

    up.on 'change', '[up-validate!="input"]', (event) -> validate(event.target)
    up.on 'input', '[up-validate="input"]', (event) -> validate(event.target)







Alternatives HTML
------------------

    <form>

      <div class="form-group">
        <label>E-mail</label>
        <input type="text" name="email" up-changes=".form-group" />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="text" name="password" up-changes=".form-group" />
      </div>
      
    </form>







Variante 2: up-validate an der Control-Gruppe
==============================================

HTML
----

    <form>

      <div class="form-group" up-validate>
        <label>E-mail</label>
        <input type="text" name="email" />
      </div>

      <div class="form-group" up-validate>
        <label>Password</label>
        <input type="text" name="password" />
      </div>
      
    </form>


Implementierung
---------------

    validate = (elementOrSelector, options) ->
      $start = $(elementOrSelector) # $start is either a control or a form group
      $group = $start.closest('[up-validate], form')
      $form = $formGroup.closest('form')
      $validateFlag = $('<input type="hidden" name="up-validate" value="1" >')
      $validateFlag.appendTo($form)
      groupSelector = u.createSelectorFromElement($group)
      up.submit($form, target: groupSelector, failTarget: groupSelector, origin: )

    up.on 'change', '[up-validate!="input"]', (event) -> validate(event.target)
    up.on 'input', '[up-validate="input"]', (event) -> validate(event.target)




Variante 2: up-validate am Input, Up.js weiß wie Control-Gruppen gefunden werden
================================================================================

HTML
----

    <form>

      <div class="form-group">
        <label>E-mail</label>
        <input type="text" name="email" up-validate />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="text" name="password" up-validate />
      </div>
      
    </form>


Implementierung
---------------

    config.groups = ['.form-group']

    validate = (elementOrSelector, options) ->
      $control = $(elementOrSelector)
      $formGroup = u.multiSelector(config.groups).seekUp($control) || $control.closest('form')
      $form = $formGroup.closest('form')
      $validateFlag = $('<input type="hidden" name="up-validate" value="1" >')
      $validateFlag.appendTo($form)
      groupSelector = u.createSelectorFromElement($formGroup)
      up.submit($form, target: groupSelector, failTarget: groupSelector)

    up.on 'change', '[up-validate!="input"]', (event) -> validate(this)
    up.on 'input', '[up-validate="input"]', (event) -> validate(this)


Alle Varianten: In Rails Controller
===================================


    class UsersController < ApplicationController

      def create
        build_user

        if up?

        if up.validate?


        if request.up.validate?   # same as `params['up-validate'].present?`
          @user.valid?            # run validations
          render 'new'
        elsif @user.save?
          sign_in @user
          redirect_to root_path
        else
          render 'new', status: :bad_request
        end
      end

    end

