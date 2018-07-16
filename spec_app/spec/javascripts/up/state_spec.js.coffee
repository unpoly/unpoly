describe 'up.state', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.state.restore', ->

      it "visits the URL of a state with the given name"

      it "accepts a { target } option"

      it "merges { params } option into the saved params"

      it "merges { data } option into the saved params"

      it "rejects if the given state name is unknown"


    describe 'up.state.save', ->

      it "saves a new state with the given name, serializing the current screen state"

      it "throws an error if the given name contains a space"

      it "merges { params} into the current screen state"

      it "updates an existing state"

      it 'honors the cache size limit'

      it 'stores the state in sessionStorage so it survives a vanilla link'


    describe 'up.state.discard', ->

      it 'discards a state with the given name'

      it 'throws an error if the given state name is unknown'


    describe 'up.state.first', ->

      it 'returns a state with the given name'

      it 'returns a state with one of the given namen'

      it 'returns undefined if the given state name is unknown'


    describe 'up.state.all', ->

      it 'returns an array of all saved states'


  describe 'unobtrusive behavior', ->

    describe 'a[up-save-state]', ->

      it 'saves a state with the current URL, then follows the link', asyncSpec (next) ->
        url = up.history.url()
        $link = affix('a[up-follow][up-save-state="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.state.first('wp')
          expect(wp).toBeDefined()
          expect(wp.url).toMatchUrl(url)

          # Show that we did make a request to the link's [href]
          expect(@lastRequest().url).toMatchUrl('/path')

      it "saves the current scroll positions when clicked"

      it "saves a state with params from a form on the screen", asyncSpec (next) ->
        $form = affix('form')
        $form.affix('input[type="text"][name="field1"][val="value1"]')
        $form.affix('input[type="text"][name="field2"][val="value2"]')
        $link = affix('a[up-follow][up-save-state="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.state.first('wp')
          expect(wp).toBeDefined()
          expect(wp.params).toEqual(field1: 'value1', field2: 'value2')

      it "saves a state with params from a form on the screen", asyncSpec (next) ->
        $form = affix('form')
        $form.affix('input').attr(type: "text", name: "user[email]", value: 'foo@bar.de')
        $form.affix('input').attr(type: "text", name: "user[password]", value: 'secret')
        $form.affix('input').attr(type: "text", name: "user[hobbies][]", value: 'Swimming')
        $form.affix('input').attr(type: "text", name: "user[hobbies][]", value: 'Riding')

        $link = affix('a[up-follow][up-save-state="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.state.first('wp')
          expect(wp).toBeDefined()
          expect(wp.params).toEqual
            user:
              email: 'foo@bar.de'
              password: 'secret'
              hobbies: ['Swimming', 'Riding']

      it "merges the params from multiple forms", asyncSpec (next) ->
        $form1 = affix('form')
        $form1.affix('input[type="text"][name="field1"][val="value1"]')
        $form1.affix('input[type="text"][name="field2"][val="value2"]')
        $form2 = affix('form')
        $form2.affix('input[type="text"][name="field3"][val="value3"]')
        $form2.affix('input[type="text"][name="field4"][val="value4"]')
        $link = affix('a[up-follow][up-save-state="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.state.first('wp')
          expect(wp).toBeDefined()
          expect(wp.params).toEqual
            field1: 'value1'
            field2: 'value2'
            field3: 'value3'
            field4: 'value4'

      it "saves a state with the name 'default' if no name is given"

      it "only saves forms on the same layer as this link"

      it "only saves forms in the subtree of an optional [up-root] selector"

      it "doesn't save a form with [up-save-form=false] attribute"

      it "merges flat params from JSON in an [up-params] attribute into form params"

      it "merges nested params from JSON in an [up-params] attribute into form params"

      it 'ignores some form fields in config (such as authenticity token)'

      it "saves client-side meta information from JSON in an [up-data] attribute"

      it "follows the link after saving"

      it "does not save a state when preloading"

      it "overwrites an existing state with the same name"

      it "saves multiple waypoints in a space-separated list of names"

      it "passes the state to the compiler's { data }"

#      describe 'up:state:save event', ->
#
#        it "is emitted before the state is saved"
#
#        it "is not emitted when preloading"
#
#        it "allows to change { url } before saving"
#
#        it "allows to change flat { params } before saving"
#
#        it "allows to change nested { params } before saving"
#
#        it "allows to change { data } before saving"
#
#      describe 'up:state:saved event', ->
#
#        it 'is emitted after the state is saved'
#
#        it 'is passed the state that was just saved'


    describe 'a[up-restore-state]', ->

      it "changes the follow { url } to the saved state's URL"

      it "change's the link's HTTP method to GET"

      it "encodes saved params into the follow { url }'s query section"

      it "uses the original link's [href] and method if no state with that name is saved"

      it "merges flat params from JSON in an [up-params] attribute into saved params"

      it "merges nested params from JSON in an [up-params] attribute into saved params"

      it "merges client-side meta information from JSON in an [up-data] attribute into saved { data }"

      it "discards the restored state"

      it "does not discard the restored state when preloading"

      it "restores the first known state in a space-separated list of names"

      it "does not change the link's [up-target], even though another URL is loaded"

#      describe 'up:state:restore event', ->
#
#        it 'is emitted before the state is restored'
#
#        it 'is passed the previously saved state'
#
#        it "allows to change { url } before saving"
#
#        it "allows to change flat { params } before restoring"
#
#        it "allows to change nested { params } before restoring"
#
#        it "allows to change { data } before restoring"
#
#        it "does not propagate changes to the state cache, in case the state is restored again"
#
#      describe 'up:state:restored event', ->
#
#        it 'is emitted after the state was restored and after the link was followed'
#
#        it 'is not emitted when a state was preloaded'
#
#        it "sees the restored state's { data } to polish the restauration with JavaScript"


    describe 'a[up-discard-state]', ->

      it 'discards a state with the given name when the link is followed'

      it "does not discard a state when the link is preloaded"

      it "does nothing if the given state name isn't known"


    describe 'form[up-restore-state]', ->

      it "change's the form's HTTP method to GET"

      it "changes the follow { url } to the saved state's URL"

      it "merges the params from (1) the form fields, (2) the state and (3) the JSON in form[up-params] and encodes it all into the URL's query section"

      it "merges data from (1) the state and (2) the JSON in form[up-data]"

      it "uses the original form's [action] and method if no state with that name is saved"

      it 'ignores some form fields in config (such as authenticity token)'

  describe 'server protocol', ->

    describe 'X-Up-State-Names request header', ->

      it 'is sent with every request and contains names of all known states as a space-separated list'

    describe 'X-Up-Restore-State response header', ->

      it "let's the server restore a state, which immediately triggers another GET request (like a redirect)"

      it 'restores a state that is no longer known on the client'

      it 'restores a state without { name }'

      it 'restores a state with { method: "POST" } so controller actions can resume a previous submission'

      it "discards the state"

      it "emits a up:state:restored event once the state has been restored to the DOM"

      it 'lets the server pass { data } and { params } to merge into the restored state'

      it 'uncaches a GET response that restores a state, since another request might yield a different response from a state-aware server'

      it 'restores multiple waypoints in a row'