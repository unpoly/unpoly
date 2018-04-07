describe 'up.waypoint', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.waypoint.restore', ->

      it "visits the URL of a waypoint with the given name"

      it "accepts a { target } option"

      it "merges { params } option into the saved params"

      it "merges { data } option into the saved params"

      it "rejects if the given waypoint name is unknown"


    describe 'up.waypoint.save', ->

      it "saves a new waypoint with the given name, serializing the current screen state"

      it "throws an error if the given name contains a space"

      it "merges { params} into the current screen state"

      it "updates an existing waypoint"

      it 'honors the cache size limit'

    describe 'up.waypoint.discard', ->

      it 'discards a waypoint with the given name'

      it 'throws an error if the given waypoint name is unknown'


    describe 'up.waypoint.first', ->

      it 'returns a waypoint with the given name'

      it 'returns a waypoint with one of the given name'

      it 'returns undefined if the given waypoint name is unknown'


    describe 'up.waypoint.all', ->

      it 'returns an array of all saved waypoints'


  describe 'unobtrusive behavior', ->

    describe 'a[up-save-waypoint]', ->

      it 'saves a waypoint with the current URL, then follows the link', asyncSpec (next) ->
        url = up.history.url()
        $link = affix('a[up-follow][up-save-waypoint="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.waypoint.first('wp')
          expect(wp).toBeDefined()
          expect(wp.url).toMatchUrl(url)

          # Show that we did make a request to the link's [href]
          expect(@lastRequest().url).toMatchUrl('/path')

      it "saves the current scroll positions when clicked"

      it "saves a waypoint with params from a form on the screen", asyncSpec (next) ->
        $form = affix('form')
        $form.affix('input[type="text"][name="field1"][val="value1"]')
        $form.affix('input[type="text"][name="field2"][val="value2"]')
        $link = affix('a[up-follow][up-save-waypoint="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.waypoint.first('wp')
          expect(wp).toBeDefined()
          expect(wp.params).toEqual(field1: 'value1', field2: 'value2')

      it "saves a waypoint with params from a form on the screen", asyncSpec (next) ->
        $form = affix('form')
        $form.affix('input').attr(type: "text", name: "user[email]", value: 'foo@bar.de')
        $form.affix('input').attr(type: "text", name: "user[password]", value: 'secret')
        $form.affix('input').attr(type: "text", name: "user[hobbies][]", value: 'Swimming')
        $form.affix('input').attr(type: "text", name: "user[hobbies][]", value: 'Riding')

        $link = affix('a[up-follow][up-save-waypoint="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.waypoint.first('wp')
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
        $link = affix('a[up-follow][up-save-waypoint="wp"][href="/path"]').text('label')

        Trigger.clickSequence($link)

        next =>
          wp = up.waypoint.first('wp')
          expect(wp).toBeDefined()
          expect(wp.params).toEqual
            field1: 'value1'
            field2: 'value2'
            field3: 'value3'
            field4: 'value4'

      it "only saves forms on the same layer as this link"

      it "only saves forms in the subtree of an optional [up-root] selector"

      it "doesn't save a form with [up-save-form=false] attribute"

      it "merges flat params from JSON in an [up-params] attribute into form params"

      it "merges nested params from JSON in an [up-params] attribute into form params"

      it 'ignores some form fields in config (such as authenticity token)'

      it "saves data from JSON in an [up-data] attribute"

      it "follows the link after saving"

      it "does not save a waypoint when preloading"

      it "overwrites an existing waypoint with the same name"

      it "saves multiple waypoints in a space-separated list of names"

      describe 'up:waypoint:save event', ->

        it "is emitted before the waypoint is saved"

        it "is not emitted when preloading"

        it "can be prevented to not save a waypoint before following"

        it "allows to change { url } before saving"

        it "allows to change flat { params } before saving"

        it "allows to change nested { params } before saving"

        it "allows to change { data } before saving"

      describe 'up:waypoint:saved event', ->

        it 'is emitted after the waypoint is saved'

        it 'is passed the waypoint that was just saved'


    describe 'a[up-restore-waypoint]', ->

      it "changes the follow { url } to the saved waypoint's URL"

      it "change's the link's HTTP method to GET"

      it "encodes saved params into the follow { url }'s query section"

      it "uses the original link's [href] and method if no waypoint with that name is saved"

      it "merges flat params from JSON in an [up-params] attribute into saved params"

      it "merges nested params from JSON in an [up-params] attribute into saved params"

      it "merges data from JSON in an [up-data] attribute into saved data"

      it "discards the restored waypoint"

      it "does not discard the restored waypoint when preloading"

      it "restores the first known waypoint in a space-separated list of names"

      it "does not change the link's [up-target], even though another URL is loaded"

      describe 'up:waypoint:restore event', ->

        it 'is emitted before the waypoint is restored'

        it 'is passed the previously saved waypoint'

        it "allows to change { url } before saving"

        it "allows to change flat { params } before restoring"

        it "allows to change nested { params } before restoring"

        it "allows to change { data } before restoring"

        it "does not propagate changes to the waypoint cache, in case the waypoint is restored again"

        describe 'when prevented', ->

          it "follows the link's original URL instead"

          it "does not discard the waypoint"

      describe 'up:waypoint:restored event', ->

        it 'is emitted after the waypoint was restored and after the link was followed'

        it 'is not emitted when a waypoint was preloaded'

        it "sees the restored waypoint's { data } to polish the restauration with JavaScript"


    describe 'a[up-discard-waypoint]', ->

      it 'discards a waypoint with the given name when the link is followed'

      it "does not discard a waypoint when the link is preloaded"

      it "does nothing if the given waypoint name isn't known"


    describe 'form[up-restore-waypoint]', ->

      it "change's the form's HTTP method to GET"

      it "changes the follow { url } to the saved waypoint's URL"

      it "merges the params from (1) the form fields, (2) the waypoint and (3) the JSON in form[up-params] and encodes it all into the URL's query section"

      it "merges data from (1) the waypoint and (2) the JSON in form[up-data]"

      it "uses the original form's [action] and method if no waypoint with that name is saved"

      it 'ignores some form fields in config (such as authenticity token)'

  describe 'server protocol', ->

    describe 'X-Up-Waypoints request header', ->

      it 'is sent with every request and contains a space-separated list of currently saved waypoints'

    describe 'X-Up-Restore-Waypoint response header', ->

      it "let's the server restore a waypoint, which immediately triggers another GET request (like a redirect)"

      it 'fulfills up.request() with the response from the restored waypoint'

      it "discards the waypoint"

      it "emits a preventable up:waypoint:restore event"

      it "is ignored if no waypoint with that name is saved"

      it 'lets the server pass { data } and { params } to merge into the restored waypoint'

      it 'uncaches a GET response that restores a waypoint, since another request might yield a different response from a waypoint-aware server'

