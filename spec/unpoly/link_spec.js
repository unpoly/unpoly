let u = up.util
const e = up.element
const $ = jQuery

describe('up.link', function() {

  u = up.util

  describe('JavaScript functions', function() {

    require('./link_follow_fn_spec')

    describe("when the link's [href] is '#'", function() {

      it('does not follow the link', async function() {
        fixture('.target', { text: 'old text' })

        const link = fixture('a[href="#"][up-target=".target"]')
        const renderJob = up.follow(link)

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Error))
        expect('.target').toHaveText('old text')
      })

      it('does follow the link if it has a local content attribute', async function() {
        fixture('.target', { text: 'old text' })

        const link = fixture('a[href="#"][up-target=".target"][up-content="new text"]')
        const promise = up.follow(link)

        await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
        expect('.target').toHaveText('new text')
      })
    })

    describe('up.link.followOptions()', function() {

      it('parses the render options that would be used to follow the given link', function() {
        const link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        const options = up.link.followOptions(link)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')
      })

      it('does not render', function() {
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        const link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        const options = up.link.followOptions(link)
        expect(up.render).not.toHaveBeenCalled()
      })

      it('parses the link method from a [data-method] attribute so we can replace the Rails UJS adapter with Unpoly', function() {
        const link = fixture('a[href="/path"][data-method="patch"]')
        const options = up.link.followOptions(link)
        expect(options.method).toEqual('PATCH')
      })

      it("prefers a link's [up-href] attribute to its [href] attribute", function() {
        const link = fixture('a[href="/foo"][up-href="/bar"]')
        const options = up.link.followOptions(link)
        expect(options.url).toEqual('/bar')
      })

      it('parses an [up-on-finished] attribute', function() {
        window.onFinishedCallback = jasmine.createSpy('onFinished callback')
        const link = fixture('a[href="/path"][up-on-finished="nonce-specs-nonce window.onFinishedCallback(this)"]')
        const options = up.link.followOptions(link)

        expect(u.isFunction(options.onFinished)).toBe(true)
        options.onFinished()

        expect(window.onFinishedCallback).toHaveBeenCalledWith(link)

        delete window.onFinishedCallback
      })

      it('parses an [up-background] attribute', function() {
        const link = fixture('a[href="/foo"][up-background="true"]')
        const options = up.link.followOptions(link)
        expect(options.background).toBe(true)
      })

      it('parses an [up-use-keep] attribute as { keep }', function() {
        const link = fixture('a[href="/foo"][up-use-keep="false"]')
        const options = up.link.followOptions(link)
        expect(options.keep).toBe(false)
      })

      it('parses an [up-use-hungry] attribute as { hungry }', function() {
        const link = fixture('a[href="/foo"][up-use-hungry="false"]')
        const options = up.link.followOptions(link)
        expect(options.hungry).toBe(false)
      })

      it('parses an [up-use-data] attribute as a { data } object', function() {
        const link = fixture('a[href="/foo"][up-use-data="{ foo: 123 }"]')
        const options = up.link.followOptions(link)
        expect(options.data).toEqual({ foo: 123 })
      })

      it('does not default to an empty { data } object if no [up-use-data] is set', function() {
        const link = fixture('a[href="/foo"]')
        const options = up.link.followOptions(link)
        expect(options.data).toBeUndefined()
      })

      it('parses an [up-timeout] attribute', function() {
        const link = fixture('a[href="/foo"][up-timeout="20_000"]')
        const options = up.link.followOptions(link)
        expect(options.timeout).toBe(20000)
      })

      it('parses an [up-animation] attribute', function() {
        const link = fixture('a[href="/foo"][up-animation="move-from-top"]')
        const options = up.link.followOptions(link)
        expect(options.animation).toBe('move-from-top')
      })

      describe('[up-scroll]', function() {

        it('parses a scrolling option keyword', function() {
          const link = fixture('a[href="/foo"][up-scroll="top"]')
          const options = up.link.followOptions(link)
          expect(options.scroll).toBe('top')
        })

        it('parses a pixel value as a number (not as a string)', function() {
          const link = fixture('a[href="/foo"][up-scroll="367"]')
          const options = up.link.followOptions(link)
          expect(options.scroll).toBe(367)
        })

        it('parses a boolean value', function() {
          const link = fixture('a[href="/foo"][up-scroll="false"]')
          const options = up.link.followOptions(link)
          expect(options.scroll).toBe(false)
        })

      })

      it('parses an [up-scroll-behavior] attribute', function() {
        const link = fixture('a[href="/foo"][up-scroll-behavior="instant"]')
        const options = up.link.followOptions(link)
        expect(options.scrollBehavior).toBe('instant')
      })

      it('parses an [up-content] attribute', function() {
        const link = fixture('a[href="/foo"][up-content="new text"]')
        const options = up.link.followOptions(link)
        expect(options.content).toBe('new text')
      })

      it('parses an [up-history] attribute', function() {
        const link = fixture('a[href="/foo"][up-history="false"]')
        const options = up.link.followOptions(link)
        expect(options.history).toBe(false)
      })

      it('parses an [up-title] attribute', function() {
        const link = fixture('a[href="/foo"][up-title="false"]')
        const options = up.link.followOptions(link)
        expect(options.title).toBe(false)
      })

      it('parses an [up-location] attribute', function() {
        const link = fixture('a[href="/foo"][up-location="false"]')
        const options = up.link.followOptions(link)
        expect(options.location).toBe(false)
      })

      it('parses an [up-meta-tags] attribute', function() {
        const link = fixture('a[href="/foo"][up-meta-tags="false"]')
        const options = up.link.followOptions(link)
        expect(options.metaTags).toBe(false)
      })

      it('parses an [up-lang=false] attribute as boolean', function() {
        const link = fixture('a[href="/foo"][up-lang="false"]')
        const options = up.link.followOptions(link)
        expect(options.lang).toBe(false)
      })

      it('parses an [up-lang="string"] attribute as string', function() {
        const link = fixture('a[href="/foo"][up-lang="fr"]')
        const options = up.link.followOptions(link)
        expect(options.lang).toBe('fr')
      })

      it('parses an [up-focus-visible=false] attribute as boolean', function() {
        const link = fixture('a[href="/foo"][up-focus-visible="false"]')
        const options = up.link.followOptions(link)
        expect(options.focusVisible).toBe(false)
      })

      it('parses an [up-focus-visible="auto"] attribute as string', function() {
        const link = fixture('a[href="/foo"][up-focus-visible="auto"]')
        const options = up.link.followOptions(link)
        expect(options.focusVisible).toBe('auto')
      })

      it('parses an [up-match] attribute', function() {
        const link = fixture('a[href="/foo"][up-match="first"]')
        const options = up.link.followOptions(link)
        expect(options.match).toBe('first')
      })

      it('parses an [up-preview] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-preview="foo bar"]')
        const options = up.link.followOptions(link)
        expect(options.preview).toBe('foo bar')
      })

      it('parses an [up-revalidate-preview] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-revalidate-preview="foo bar"]')
        const options = up.link.followOptions(link)
        expect(options.revalidatePreview).toBe('foo bar')
      })

      it('parses an [up-revalidate-preview] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-revalidate-preview="true"]')
        const options = up.link.followOptions(link)
        expect(options.revalidatePreview).toBe(true)
      })

      it('parses an [up-placeholder] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-placeholder="loading..."]')
        const options = up.link.followOptions(link)
        expect(options.placeholder).toBe('loading...')
      })

      it('parses an [up-late-delay=Number] attribute as a number', function() {
        const link = fixture('a[href="/foo"][up-late-delay=123]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.lateDelay).toBe(123)
      })

      it('parses an [up-late-delay=false] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-late-delay=false]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.lateDelay).toBe(false)
      })

      it('parses an [up-disable] attribute as a selector string', function() {
        const link = fixture('a[href="/foo"][up-disable=".field"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.disable).toBe('.field')
      })

      it('parses a value-less [up-disable] attribute as a true boolean', function() {
        const link = fixture('a[href="/foo"][up-disable]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.disable).toBe(true)
      })

      it('parses an [up-fail] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-fail="false"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.fail).toBe(false)
      })

      it('parses an [up-animation] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-animation="fade-in"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.animation).toBe('fade-in')
      })

      it('parses an [up-animation=false] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-animation="false"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.animation).toBe(false)
      })

      it('parses an [up-transition] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-transition="fade-in"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.transition).toBe('fade-in')
      })

      it('parses an [up-transition=false] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-transition="false"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.transition).toBe(false)
      })

      describe('[up-use-data-map]', function() {

        it('parses a relaxed JSON value into a { dataMap } option (not { useDataMap })', function() {
          const link = htmlFixture(`
            <a
              href="/dashboard"
              up-target="#left, #right"
              up-use-data-map="{ '#left': { leftKey: 'leftValue' }, '#right': { rightKey: 'rightValue' } }"
            >
              Link label
            </a>
          `)
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.dataMap).toEqual({ '#left': { leftKey: 'leftValue' }, '#right': { rightKey: 'rightValue' } })
        })

        it('returns a missing value if the the attribute is missing', function() {
          const link = fixture('a[href="/foo"][up-follow]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.dataMap).toBeMissing()
        })

      })

      describe('[up-scroll-map]', function() {

        it('parses a relaxed JSON value', function() {
          const link = htmlFixture(`
            <a
              href="/dashboard"
              up-target="#left, #right"
              up-scroll-map="{ '#left': 'bottom', '#right': 'bottom' }"
            >
              Link label
            </a>
          `)
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scrollMap).toEqual({ '#left': 'bottom', '#right': 'bottom' })
        })

        it('returns a missing value if the the attribute is missing', function() {
          const link = fixture('a[href="/foo"][up-follow]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scrollMap).toBeMissing()
        })

      })

      describe('[up-peel]', function() {

        it('parses [up-peel] as true', function() {
          const link = fixture('a[href="/foo"][up-peel]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe(true)
        })

        it('parses [up-peel=true] as true', function() {
          const link = fixture('a[href="/foo"][up-peel="true"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe(true)
        })

        it('parses [up-peel=false] as false', function() {
          const link = fixture('a[href="/foo"][up-peel="false"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe(false)
        })

        it('parses [up-peel="accept"] as "accept"', function() {
          const link = fixture('a[href="/foo"][up-peel="accept"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe("accept")
        })

        it('parses [up-peel="dismiss"] as "dismiss"', function() {
          const link = fixture('a[href="/foo"][up-peel="dismiss"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe("dismiss")
        })

      })

      describe('[up-accept-fragment]', function() {

        it('parses as a string', function() {
          const link = fixture('a[href="/foo"][up-accept-fragment="#foo"]')
          const options = up.link.followOptions(link)
          expect(options.acceptFragment).toBe('#foo')
        })

      })

      describe('[up-dismiss-fragment]', function() {

        it('parses as a string', function() {
          const link = fixture('a[href="/foo"][up-dismiss-fragment="#foo"]')
          const options = up.link.followOptions(link)
          expect(options.dismissFragment).toBe('#foo')
        })

      })

      if (up.migrate.loaded) {
        it('parses an [up-reset-scroll] attribute as { scroll: "top" }', function() {
          const link = fixture('a[href="/foo"][up-reset-scroll]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scroll).toBe('top')
        })

        it('parses an [up-restore-scroll] attribute as { scroll: "restore" }', function() {
          const link = fixture('a[href="/foo"][up-restore-scroll]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scroll).toBe('restore')
        })

        it('parses an [up-reveal=false] attribute as { scroll: false }', function() {
          const link = fixture('a[href="/foo"][up-reveal=false]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scroll).toBe(false)
        })

        it('parses an [up-bad-response-time=Number] attribute as { lateDelay: Number }', function() {
          const link = fixture('a[href="/foo"][up-bad-response-time=123]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.lateDelay).toBe(123)
        })

        describe('[up-dismissable]', function() {

          it('parses into { dismissible }', function() {
            const link = fixture('a[href="/foo"][up-layer="new"][up-dismissable="key"]')
            up.hello(link)

            const options = up.link.followOptions(link)
            expect(options.dismissible).toBe('key')
          })

        })

      }
    })

    describe('up.link.shouldFollowEvent', function() {

      const buildEvent = function(target, attrs) {
        const event = Trigger.createMouseEvent('mousedown', attrs)
        // Cannot change event.target on a native event property, but we can with Object.defineProperty()
        Object.defineProperty(event, 'target', { get() { return target } })
        return event
      }

      it("returns true when the given event's target is the given link itself", function() {
        const $link = $fixture('a[href="/foo"]')
        const event = buildEvent($link[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)
      })

      it("returns true when the given event's target is a non-link child of the given link", function() {
        const $link = $fixture('a[href="/foo"]')
        const $span = $link.affix('span')
        const event = buildEvent($span[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)
      })

      it("returns false when the given event's target is a child link of the given link (think [up-expand])", function() {
        const $link = $fixture('div[up-href="/foo"]')
        const $childLink = $link.affix('a[href="/bar"]')
        const event = buildEvent($childLink[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)
      })

      it("returns false when the given event's target is a child input of the given link (think [up-expand])", function() {
        const $link = $fixture('div[up-href="/foo"]')
        const $childInput = $link.affix('input[type="text"]')
        const event = buildEvent($childInput[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)
      })
    })

    describe('up.link.makeFollowable', function() {

      it("adds [up-follow] to a link that wouldn't otherwise be handled by Unpoly", function() {
        const $link = $fixture('a[href="/path"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toEqual('')
      })

      it("does not add [up-follow] to a link that is already [up-target]", function() {
        const $link = $fixture('a[href="/path"][up-target=".target"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toBeMissing()
      })
    })

    describe('up.visit', function() {
      it('should have tests')
    })

    describe('up.link.isFollowable', function() {

      it('returns true for an [up-target] link', function() {
        const link = fixture('a[href="/foo"][up-target=".target"]')
        up.hello(link)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns true for an [up-follow] link', function() {
        const link = fixture('a[href="/foo"][up-follow]')
        up.hello(link)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns true for an [up-layer] link', function() {
        const $link = $fixture('a[href="/foo"][up-layer="modal"]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(true)
      })

      it('returns true for an [up-follow] link', function() {
        const $link = $fixture('a[href="/foo"][up-follow]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(true)
      })

      it('returns true for an [up-preload] link', function() {
        const $link = $fixture('a[href="/foo"][up-preload]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(true)
      })

      if (up.migrate.loaded) {
        it('returns true for an [up-instant][href] link', function() {
          const $link = $fixture('a[href="/foo"][up-instant]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })

        it('returns true for a faux [up-instant][up-href] link', function() {
          const $link = $fixture('span[up-href="/foo"][up-instant]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })
      } else {
        it('returns false for an [up-instant] link (because we also have a[up-emit][up-instant])', function() {
          const $link = $fixture('a[href="/foo"][up-instant]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(false)
        })
      }

      if (up.migrate.loaded) {
        it('returns true for an [up-modal] link', function() {
          const $link = $fixture('a[href="/foo"][up-modal=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })

        it('returns true for an [up-popup] link', function() {
          const $link = $fixture('a[href="/foo"][up-popup=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })

        it('returns true for an [up-drawer] link', function() {
          const $link = $fixture('a[href="/foo"][up-drawer=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })
      }

      if (up.migrate.loaded) {
        it('returns true for an [up-target] span with [up-href]', function() {
          const $link = $fixture('span[up-href="/foo"][up-target=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })
      }

      it('returns false if the given link will be handled by the browser', function() {
        const $link = $fixture('a[href="/foo"]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(false)
      })

      it('returns false if the given link will be handled by Rails UJS', function() {
        const $link = $fixture('a[href="/foo"][data-method="put"]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(false)
      })

      it('returns true if the given link matches a custom up.link.config.followSelectors', function() {
        const link = fixture('a.hyperlink[href="/foo"]')
        up.link.config.followSelectors.push('.hyperlink')
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false if the given link matches a custom up.link.config.followSelectors, but also has [up-follow=false]', function() {
        const link = fixture('a.hyperlink[href="/foo"][up-follow="false"]')
        up.link.config.followSelectors.push('.hyperlink')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for a link with a [href] to another host ("cross origin")', function() {
        const link = fixture('a[up-follow][href="https://other-host/path"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns true for a link with a [href] to this host when it also includes this port explicitly', function() {
        const link = fixture(`a[up-follow][href=//${location.hostname}:${location.port}/path]`)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false for a link with a [href] to this host, but another port', function() {
        const link = fixture(`a[up-follow][href=//${location.hostname}:97334/path]`)
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for a link with a [up-href] to another host', function() {
        const link = fixture('a[up-follow][href="/path"][up-href="https://other-host/path"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns true for a link with a [up-href] to a fully qualified URL on this host', function() {
        const link = fixture(`a[up-follow][href='/path'][up-href=//${location.host}/path]`)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false for a link with a [up-href] to this host, but another port', function() {
        const link = fixture(`a[up-follow][href='/path'][up-href=//${location.host}:97334/path]`)
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for an #anchor link without a path, even if the link has [up-follow]', function() {
        const link = fixture('a[up-follow][href="#details"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for an #anchor link with a path, even if the link has [up-follow]', function() {
        const link = fixture('a[up-follow][href="/other/page#details"]')
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false for a link with a "javascript:..." [href] attribute, even if the link has [up-follow]', function() {
        const link = fixture('a[up-follow][href="javascript:foo()"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for a link with [up-follow] that also matches up.link.config.noFollowSelectors', function() {
        up.link.config.noFollowSelectors.push('.foo')
        const link = fixture('a.foo[up-follow][href="/foo"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for an [href="#"] link', function() {
        const link = fixture('a[href="#"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns true for an [href="#"] link that updates local content', function() {
        const link = fixture('a[href="#"][up-content="foo"]')
        expect(up.link.isFollowable(link)).toBe(true)
      })
    })

    describe('up.link.preload()', function() {

      beforeEach(function() {
        this.requestTarget = () => jasmine.lastRequest().requestHeaders['X-Up-Target']
      })

      it("loads and caches the given link's destination", async function() {
        fixture('.target')
        const link = fixture('a[href="/path"][up-target=".target"]')

        up.link.preload(link)

        await wait()

        expect({
          url: '/path',
          target: '.target',
          failTarget: 'default-fallback',
          origin: link
        }).toBeCached()
      })

      it('accepts options that overrides those options that were parsed from the link', async function() {
        fixture('.target')
        const link = fixture('a[href="/path"][up-target=".target"]')
        up.link.preload(link, { url: '/options-path' })

        await wait()

        expect({
          url: '/options-path',
          target: '.target',
          failTarget: 'default-fallback',
          origin: link
        }).toBeCached()
      })

      it('does not dispatch another request for a link that is currently loading', async function() {
        const link = fixture('a[href="/path"][up-target=".target"]')
        up.follow(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)

        up.link.preload(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('does not update fragments for a link with local content (bugfix)', async function() {
        const target = fixture('.target', { text: 'old text' })
        const link = fixture('a[up-content="new text"][up-target=".target"]')

        up.link.preload(link)

        await wait()

        expect('.target').toHaveText('old text')
      })

      it('does not call an { onRendered } callback', async function() {
        const onRendered = jasmine.createSpy('{ onRendered } callback')
        fixture('.target')
        const link = fixture('a[up-href="/path"][up-target=".target"]')

        const promise = up.link.preload(link, { onRendered })

        await wait()

        jasmine.respondWithSelector('.target')

        await expectAsync(promise).toBeResolved()

        expect(onRendered).not.toHaveBeenCalled()
      })

      describe('for an [up-target] link', function() {

        it('includes the [up-target] selector as an X-Up-Target header if the targeted element is currently on the page', async function() {
          fixture('.target')
          const link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          expect(this.requestTarget()).toEqual('.target')
        })

        it('replaces the [up-target] selector as with a fallback and uses that as an X-Up-Target header if the targeted element is not currently on the page', async function() {
          const link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          // The default fallback would usually be `body`, but in Jasmine specs we change
          // it to protect the test runner during failures.
          expect(this.requestTarget()).toEqual('default-fallback')
        })
      })

      describe('for a link opening a new layer', function() {

        beforeEach(function() {
          up.motion.config.enabled = false
        })

        it('includes the selector as an X-Up-Target header and does not replace it with a fallback, since the layer frame always exists', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new"]')
          up.hello(link)

          up.link.preload(link)

          await wait()

          expect(this.requestTarget()).toEqual('.target')
        })

        it('does not create layer elements', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)

          up.link.preload(link)

          await wait()

          expect('up-modal').not.toBeAttached()
        })

        it('does not emit an up:layer:open event', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          const openListener = jasmine.createSpy('listener')
          up.on('up:layer:open', openListener)

          up.link.preload(link)

          await wait()

          expect(openListener).not.toHaveBeenCalled()
        })

        it('does not close a currently open overlay', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          const closeListener = jasmine.createSpy('listener')
          up.on('up:layer:dismiss', closeListener)

          up.layer.open({ mode: 'modal', fragment: '<div class="content">Modal content</div>' })

          await wait()

          expect('up-modal .content').toBeAttached()

          up.link.preload(link)

          await wait()

          expect('up-modal .content').toBeAttached()
          expect(closeListener).not.toHaveBeenCalled()

          up.layer.dismiss()

          await wait()

          expect('up-modal .content').not.toBeAttached()
          expect(closeListener).toHaveBeenCalled()
        })

        it('does not prevent the opening of other overlays while the request is still pending', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          up.link.preload(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          up.layer.open({ mode: 'modal', fragment: '<div class="content">Modal content</div>' })

          await wait()

          expect('up-modal .content').toBeAttached()
        })

        it('calls up.request() with a { background: true } option', async function() {
          const requestSpy = spyOn(up, 'request').and.callThrough()

          const $link = $fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello($link)
          up.link.preload($link)

          await wait()

          expect(requestSpy).toHaveBeenCalledWith(jasmine.objectContaining({ background: true }))
        })
      })

      describe('aborting', function() {

        it('is not abortable by default', async function() {
          const link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          expect(up.network.isBusy()).toBe(true)

          up.fragment.abort()

          await wait()

          expect(up.network.isBusy()).toBe(true)
        })

        it('is abortable with { abortable: true }', async function() {
          const link = fixture('a[href="/path"][up-target=".target"]')
          const preloadJob = up.link.preload(link, { abortable: true })

          await wait()

          expect(up.network.isBusy()).toBe(true)

          up.fragment.abort()

          await expectAsync(preloadJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(up.network.isBusy()).toBe(false)
        })

        it('does not abort other follow requests for the same target', async function() {
          const link1 = fixture('a[href="/path1"][up-target=".target"]')
          const link2 = fixture('a[href="/path2"][up-target=".target"]')

          up.link.follow(link1)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          const preloadJob = up.link.preload(link2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('does not abort other preload requests for the same target', async function() {
          const link1 = fixture('a[href="/path1"][up-target=".target"]')
          const link2 = fixture('a[href="/path2"][up-target=".target"]')

          up.link.preload(link1)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          const preloadJob = up.link.preload(link2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })
      })
    })

    describe('up.deferred.load()', function() {

      it('loads a partial that deferred loading to the user with [up-defer="manual"]', async function() {
        const partial = fixture('a#slow[href="/slow-path"][up-defer="manual"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(0)

        up.deferred.load(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        jasmine.respondWithSelector('#slow', { text: 'partial content' })

        await wait()

        expect('#slow').toHaveText('partial content')
      })

      it('returns an up.RenderJob that resolves with the render pass')
    })
  })

  describe('unobtrusive behavior', function() {

    require('./link_target_spec')

    require('./link_follow_attr_spec')

    if (up.migrate.loaded) {

      describe('[up-dash]', function() {

        it("is a shortcut for [up-preload], [up-instant] and [up-target], using [up-dash]'s value as [up-target]", function() {
          const $link = $fixture('a[href="/path"][up-dash=".target"]').text('label')
          up.hello($link)
          expect($link.attr('up-preload')).toEqual('')
          expect($link.attr('up-instant')).toEqual('')
          expect($link.attr('up-target')).toEqual('.target')
        })

        it('sets [up-follow] instead of [up-target] if no target is given (bugfix)', function() {
          const link = fixture('a[href="/path"][up-dash]', { text: 'label' })
          up.hello(link)

          expect(link).not.toHaveAttribute('up-target')
          expect(link).toHaveAttribute('up-follow')
        })

        it("removes the [up-dash] attribute when it's done", function() {
          const $link = $fixture('a[href="/path"]').text('label')
          up.hello($link)
          expect($link.attr('up-dash')).toBeMissing()
        })
      })
    }

    describe('[up-expand]', function() {

      it('makes the element followable to the same destination as the first contained link', async function() {
        up.fragment.config.mainTargets = ['main']
        fixture('main', { text: 'old text' })
        const area = fixture('div[up-expand] a[href="/path"]')
        up.hello(area)

        expect(area).toBeFollowable()

        Trigger.clickSequence(area)

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('main')

        jasmine.respondWithSelector('main', { text: 'new text' })

        await wait()

        expect('main').toHaveText('new text')
      })

      describe('feedback classes', function() {

        it('marks both [up-expand] container and first link as .up-active when the first link is clicked', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target">link1</a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link1)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('marks both [up-expand] container and first link as .up-active when the container is clicked', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target">link1</a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(container)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('marks the [up-expand] container as active if a child of the link was clicked', async function() {
          let [container, link1, link1Child, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target"><span>link1</span></a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link1Child)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('does not mark an [up-expand] as active if the clicked link is not the first link', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target">link1</a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link2)

          expect(link1).not.toHaveClass('up-active')
          expect(link2).toHaveClass('up-active')
          expect(container).not.toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('does not mark an [up-expand] as active if the first link is clicked, but is not the expanding link', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand="link2">
              <a id="link1" href="/path1" up-target="#target">link1</a>
              <a id="link2" href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link1)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).not.toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

      })

      it('is not keyboard-accessible, as screen readers will already announce the contained link', function() {
        const area = fixture('div[up-expand]')
        const link = e.affix(area, 'a[href="/path1"]')
        up.hello(area)

        expect(area).not.toBeKeyboardFocusable()
        expect(area.role).toBeBlank()
      })

      it('has a pointer cursor for visually abled mouse users', function() {
        const area = fixture('div[up-expand]')
        const link = e.affix(area, 'a[href="/path1"]')
        up.hello(area)

        expect(area).toHaveCursorStyle('pointer')
      })

      it('does not enlarge an area with [up-expand=false]', function() {
        const area = fixture('div[up-expand=false] a[href="/path"]')
        up.hello(area)

        expect(area).not.toBeFollowable()
      })

      it('copies up-related attributes of a contained link', function() {
        const $area = $fixture('div[up-expand] a[href="/path"][up-target="selector"][up-instant][up-preload]')
        up.hello($area)
        expect($area.attr('up-target')).toEqual('selector')
        expect($area.attr('up-instant')).toEqual('')
        expect($area.attr('up-preload')).toEqual('')
      })

//      it 'copies up-related classes of a contained link', ->
//        area = fixture('div[up-expand] a[href="/path"].up-current')
//        up.hello(area)
//        expect(area.attr('up-target')).toEqual('selector')

      it("renames a contained link's [href] attribute to [up-href] so the container is considered a link", function() {
        const $area = $fixture('div[up-expand] a[up-follow][href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')
      })

      it('copies attributes from the first link if there are multiple links', function() {
        const $area = $fixture('div[up-expand]')
        const $link1 = $area.affix('a[href="/path1"]')
        const $link2 = $area.affix('a[href="/path2"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path1')
      })

      it("copies an contained non-link element with [up-href] attribute", function() {
        const $area = $fixture('div[up-expand] span[up-follow][up-href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')
      })

      it('can be used to enlarge the click area of a link', async function() {
        const $area = $fixture('div[up-expand] a[href="/path"]')
        up.hello($area)
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        Trigger.clickSequence($area)
        await wait()

        expect(up.render).toHaveBeenCalled()
      })

      it('does nothing when the user clicks another link in the expanded area', async function() {
        const $area = $fixture('div[up-expand]')
        const $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        const $otherLink = $area.affix('a[href="/other-path"][up-follow]')
        up.hello($area)
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($otherLink)
        await wait()

        expect(followSpy.calls.count()).toEqual(1)
        expect(followSpy.calls.mostRecent().args[0]).toEqual($otherLink[0])
      })

      it('does nothing when the user clicks on an input in the expanded area', async function() {
        const $area = $fixture('div[up-expand]')
        const $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        const $input = $area.affix('input[name=email][type=text]')
        up.hello($area)
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($input)
        await wait()

        expect(followSpy).not.toHaveBeenCalled()
      })

      it('does not trigger multiple replaces when the user clicks on the expanded area of an [up-instant] link (bugfix)', async function() {
        const $area = $fixture('div[up-expand] a[href="/path"][up-follow][up-instant]')
        up.hello($area)
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        Trigger.clickSequence($area)
        await wait()

        expect(up.render.calls.count()).toEqual(1)
      })

      if (up.migrate.loaded) {
        it('makes the expanded area followable if the expanded link is [up-dash] with a selector (bugfix)', function() {
          const $area = $fixture('div[up-expand] a[href="/path"][up-dash=".element"]')
          up.hello($area)
          expect($area).toBeFollowable()
          expect($area.attr('up-target')).toEqual('.element')
        })

        it('makes the expanded area followable if the expanded link is [up-dash] without a selector (bugfix)', function() {
          const $area = $fixture('div[up-expand] a[href="/path"][up-dash]')
          up.hello($area)
          expect($area).toBeFollowable()
        })
      }

      describe('with a CSS selector in the property value', function() {

        it("expands the contained link that matches the selector", function() {
          const $area = $fixture('div[up-expand=".second"]')
          const $link1 = $area.affix('a.first[href="/path1"]')
          const $link2 = $area.affix('a.second[href="/path2"]')
          up.hello($area)
          expect($area.attr('up-href')).toEqual('/path2')
        })

        it('does nothing if no contained link matches the selector', function() {
          const $area = $fixture('div[up-expand=".foo"]')
          const $link = $area.affix('a[href="/path1"]')
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()
        })

        it('does not match an element that is not a descendant', function() {
          const $area = $fixture('div[up-expand=".second"]')
          const $link1 = $area.affix('a.first[href="/path1"]')
          const $link2 = $fixture('a.second[href="/path2"]') // not a child of $area
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()
        })

        describe('feedback classes', function() {

          it('marks both [up-expand] container and matched link as .up-active when the container is clicked', async function() {
            let [container, link1, link2, target] = htmlFixtureList(`
              <div up-expand="#link2">
                <a id="link1" href="/path1" up-target="#target">link1</a>
                <a id="link2" href="/path2" up-target="#target">link2</a>
               </div>
               <div id="target">target</div>
            `)
            up.hello(container)

            Trigger.clickSequence(container)

            expect(link1).not.toHaveClass('up-active')
            expect(link2).toHaveClass('up-active')
            expect(container).toHaveClass('up-active')
            expect(target).toHaveClass('up-loading')
          })

          it('marks both [up-expand] container and matched link as .up-active when the link is clicked', async function() {
            let [container, link1, link2, target] = htmlFixtureList(`
              <div up-expand="#link2">
                <a id="link1" href="/path1" up-target="#target">link1</a>
                <a id="link2" href="/path2" up-target="#target">link2</a>
               </div>
               <div id="target">target</div>
            `)
            up.hello(container)

            Trigger.clickSequence(link2)

            expect(link1).not.toHaveClass('up-active')
            expect(link2).toHaveClass('up-active')
            expect(container).toHaveClass('up-active')
            expect(target).toHaveClass('up-loading')
          })

        })
      })
    })

    require('./link_preload_attr_spec')

    require('./link_defer_spec')

    describe('up:click', function() {

      describe('on a link that is not [up-instant]', function() {

        it('emits an up:click event on click', function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not crash with a synthetic click event that may not have all properties defined (bugfix)', function() {
          const link = fixture('a[href="/path"]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          const event = new Event('click', { bubbles: true, cancelable: true })
          link.dispatchEvent(event)

          expect(listener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('prevents the click event when the up:click event is prevented', function() {
          let clickEvent = null
          const link = fixture('a[href="/path"]')
          link.addEventListener('click', (event) => clickEvent = event)
          link.addEventListener('up:click', (event) => event.preventDefault())
          Trigger.click(link)
          expect(clickEvent.defaultPrevented).toBe(true)
        })

        it('does not emit an up:click event if an element has covered the click coordinates on mousedown, which would cause browsers to create a click event on body', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          link.addEventListener('mousedown', () => up.layer.open({ mode: 'cover', content: 'cover text' }))
          Trigger.mousedown(link)

          await wait()

          expect(up.layer.mode).toBe('cover')
          Trigger.click(link)

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('emits an up:click event when an element within a popup overlay is clicked with the keyboard', async function() {
          const anchor = fixture('span', { text: 'label' })
          const layer = await up.layer.open({ mode: 'popup', text: 'initial text', origin: anchor })
          const link = layer.affix('a[href="/path"]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          await wait()

          expect(link).toHaveBeenDefaultFollowed()
          expect(listener).toHaveBeenCalled()
        })

        it('does not emit an up:click event if the right mouse button is used', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { button: 2 })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not emit an up:click event if shift is pressed during the click', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { shiftKey: true })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not emit an up:click event if ctrl is pressed during the click', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { ctrlKey: true })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not emit an up:click event if meta is pressed during the click', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { metaKey: true })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('emits a prevented up:click event if the click was already prevented', function() {
          const link = fixture('a[href="/path"]')
          link.addEventListener('click', (event) => event.preventDefault())
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
          expect(listener.calls.argsFor(0)[0].defaultPrevented).toBe(true)
        })
      })

      describe('on a link that is [up-instant]', function() {

        it('emits an up:click event on mousedown', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.mousedown(link)
          expect(listener).toHaveBeenCalled()
        })

        it('does not emit an up:click event on click if there was an earlier mousedown event that was default-prevented', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          Trigger.mousedown(link)
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).not.toHaveBeenCalled()
        })

        it('prevents a click event if there was an earlier mousedown event that was converted to an up:click', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const clickListener = jasmine.createSpy('click listener')
          link.addEventListener('click', clickListener)
          Trigger.mousedown(link)
          Trigger.click(link)
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(true)
        })

        it('does not emit multiple up:click events in a single click sequence', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(1)
        })

        it('emits multiple up:click events on multiple click sequences on the same link', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(1)

          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(2)
        })

        it('does emit an up:click event on click if there was an earlier mousedown event that was not default-prevented (happens when the user CTRL+clicks and Unpoly won\'t follow)', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.mousedown(link)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
        })

        it('does emit an up:click event if there was a click without mousedown (happens when a link is activated with the Enter key)', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
        })

        it('prevents the mousedown event when the up:click event is prevented', function() {
          let mousedownEvent = null
          const link = fixture('a[href="/path"][up-instant]')
          link.addEventListener('mousedown', (event) => mousedownEvent = event)
          link.addEventListener('up:click', (event) => event.preventDefault())
          Trigger.mousedown(link)
          expect(mousedownEvent.defaultPrevented).toBe(true)
        })

        describe('on a touch device', function() {

          it('emits up:click on click (not mousedown) as the user may be long-pressing to open the context menu', async function() {
            const link = fixture('a[href="/path"][up-instant]')
            const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
            link.addEventListener('up:click', listener)

            Trigger.pointerdown(link)
            Trigger.touchstart(link)

            await wait(100)

            expect(listener.calls.count()).toBe(0)

            Trigger.mousedown(link)
            await wait()
            expect(listener.calls.count()).toBe(0)

            Trigger.click(link)
            await wait()
            expect(listener.calls.count()).toBe(1)
          })

        })

      })

      describe('on a non-interactive element that is not [up-instant]', function() {

        it('emits an up:click event on click', function() {
          const div = fixture('div')
          const listener = jasmine.createSpy('up:click listener')
          div.addEventListener('up:click', listener)
          Trigger.click(div)
          expect(listener).toHaveBeenCalled()
        })

        it('does not emit an up:click event on ANY element if the user has dragged away between mousedown and mouseup', function() {
          const div = fixture('div')
          const other = fixture('div')
          const listener = jasmine.createSpy('up:click listener')
          up.on('up:click', listener)
          Trigger.mousedown(other)
          Trigger.mouseup(div)
          Trigger.click(document.body)
          expect(listener).not.toHaveBeenCalled()
        })

        it('prevents the click event when the up:click event is prevented', function() {
          let clickEvent = null
          const div = fixture('div')
          div.addEventListener('click', (event) => clickEvent = event)
          div.addEventListener('up:click', (event) => event.preventDefault())
          Trigger.click(div)
          expect(clickEvent.defaultPrevented).toBe(true)
        })
      })

      describe('on a non-interactive element that is [up-instant]', function() {

        it('emits an up:click event on mousedown', function() {
          const div = fixture('div[up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          div.addEventListener('up:click', listener)
          Trigger.mousedown(div)
          expect(listener).toHaveBeenCalled()
        })

        describe('on a touch device', function() {

          it("emits up:click on mousedown (not click) as the user can't long-press to open a context menu", async function() {
            const link = fixture('div[up-instant]')
            const listener = jasmine.createSpy('up:click listener')
            link.addEventListener('up:click', listener)

            Trigger.pointerdown(link)
            Trigger.touchstart(link)

            await wait(100)

            expect(listener.calls.count()).toBe(0)

            Trigger.mousedown(link)
            await wait()
            expect(listener.calls.count()).toBe(1)

            Trigger.click(link)
            await wait()
            expect(listener.calls.count()).toBe(1)
          })

        })

      })

      describe('on a button[type=submit]', function() {

        it('emits an up:click event on click', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="submit">label</button>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)
        })

        it('does not emit up:click if the button is [disabled]', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="submit" disabled>label</button>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)
        })
      })

      describe('on a button[type=button]', function() {

        it('emits an up:click event on click', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="button">label</button>
            </form>
          `)
          const buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)
        })

        it('does not emit up:click if the button is [disabled]', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="button" disabled>label</button>
            </form>
          `)
          const listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)
        })
      })

      describe('on a input[type=submit]', function() {

        it('emits an up:click event on click', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <input type="submit">label</input>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)
        })

        it('does not emit up:click if the button is [disabled]', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <input type="submit" disabled>label</input>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)
        })
      })
    })

    describe('[up-clickable]', function() {

      it('makes the element emit up:click events on click', async function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')
        const clickListener = jasmine.createSpy('up:click listener')
        fauxButton.addEventListener('up:click', clickListener)

        Trigger.clickSequence(fauxButton)

        expect(clickListener.calls.count()).toBe(1)
      })

      it('makes the element emit up:click events on Enter', async function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')
        const clickListener = jasmine.createSpy('up:click listener')
        fauxButton.addEventListener('up:click', clickListener)

        Trigger.keySequence(fauxButton, 'Enter')

        expect(clickListener).toHaveBeenCalled()
      })

      it('makes the element focusable for keyboard users', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')

        expect(fauxButton).toBeKeyboardFocusable()
      })

      it('gives the element a pointer cursor if it has [up-follow] and hence looks like a link', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable][up-follow]')

        expect(getComputedStyle(fauxButton).cursor).toEqual('pointer')
      })

      it('gives the element a pointer cursor if it has [role=link] and hence looks like a link', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable][role=link]')

        expect(getComputedStyle(fauxButton).cursor).toEqual('pointer')
      })

      it('gives the element a default cursor if it does not look like a link', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')

        expect(getComputedStyle(fauxButton).cursor).toEqual('auto')
      })

      it('makes other selectors clickable via up.link.config.clickableSelectors', function() {
        up.link.config.clickableSelectors.push('.foo')
        const fauxButton = helloFixture('.foo')

        expect(fauxButton).toBeKeyboardFocusable()
        expect(fauxButton).toHaveAttribute('up-clickable')
        expect(fauxButton.role).toBe('button')
      })

      it('does not set clickable-related attributes on a form with an [up-target] attribute (bugfix)', function() {
        const form = fixture('form[method=post][action="/action"][up-target="#target"]')
        up.hello(form)
        expect(form).not.toHaveAttribute('role')
        expect(form).not.toHaveAttribute('up-clickable')
      })

      describe('when applied on a link (which is already interactive)', function() {

        it('does not set a [role] attribute', function() {
          const link = helloFixture('a[href="/path"][up-clickable]', { text: 'label' })
          expect(link).not.toHaveAttribute('role')
        })

        it('does not cause duplicate up:click events when activated with the keyboard', async function() {
          const link = helloFixture('a[href="/path"][up-clickable]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          expect(listener.calls.count()).toBe(1)
        })
      })

      describe('[role] attribute', function() {

        it('sets [role=button] on a non-interactive element', function() {
          const fauxButton = helloFixture('.hyperlink[up-clickable]')
          expect(fauxButton).toHaveAttribute('role', 'button')
        })

        it('does not override an existing [role] attribute', function() {
          const fauxButton = helloFixture('.hyperlink[up-clickable][role="existing-role"]')
          expect(fauxButton).toHaveAttribute('role', 'existing-role')
        })

        it('sets [role=link] for an a:not([href]) element, like a[up-content]', function() {
          const fauxLink = helloFixture('a[up-content="inner"][up-target="#target"]')
          expect(fauxLink).toHaveAttribute('role', 'link')
        })

        it('sets [role=link] for an [up-follow][up-href] element', function() {
          const fauxLink = helloFixture('a[up-follow][up-href="/path"]')
          expect(fauxLink).toHaveAttribute('role', 'link')
        })
      })

      describe('with [up-instant]', function() {
        it('emits up:click on mousedown instead of click', async function() {
          const fauxButton = helloFixture('.hyperlink[up-clickable][up-instant]')
          const clickListener = jasmine.createSpy('up:click listener')
          fauxButton.addEventListener('up:click', clickListener)

          Trigger.mousedown(fauxButton)
          expect(clickListener.calls.count()).toBe(1)

          // No additional up:click is emitted
          Trigger.click(fauxButton)
          expect(clickListener.calls.count()).toBe(1)
        })
      })

      describe('on an element that is already interactive', function() {

        it('does not set attributes on an a[href] element', function() {
          const realLink = helloFixture('a[href="/path"][up-clickable]')
          expect(realLink).not.toHaveAttribute('role')
          expect(realLink).not.toHaveAttribute('tabindex')
        })

        it('does not set attributes on a button element', function() {
          const realButton = helloFixture('button[up-clickable]')
          expect(realButton).not.toHaveAttribute('role')
          expect(realButton).not.toHaveAttribute('tabindex')
        })

        it('does not cause duplicate up:click events when activated with the keyboard', async function() {
          const link = helloFixture('a[href="/path"][up-clickable]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          expect(listener.calls.count()).toBe(1)
        })
      })
    })

    describe('a[up-disable]', function() {

      describe('without an attribute value', function() {
        it('disables fields of an enclosing form', async function() {
          fixture('#target', { text: 'old text' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const link = e.affix(form, 'a[href="/path"][up-target="#target"][up-disable]', { text: 'label' })

          Trigger.clickSequence(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).toBeDisabled()
        })
      })

      describe('with a selector value', function() {

        it('disables fields and buttons within the given selector', async function() {
          fixture('#target', { text: 'old text' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const button = e.affix(form, 'button[type=submit]', { text: 'button label' })
          const link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', { text: 'label' })

          Trigger.clickSequence(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).toBeDisabled()
          expect(button).toBeDisabled()

          jasmine.respondWithSelector('#target', { text: 'new text' })
          await wait()

          expect('#target').toHaveText('new text')
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()
        })

        it('does not disable controls when preloading', async function() {
          fixture('#target', { text: 'old text' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const button = e.affix(form, 'button[type=submit]', { text: 'button label' })
          const link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', { text: 'label' })

          up.link.preload(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()
        })

        it('does not disable controls when revalidating', async function() {
          await jasmine.populateCache('/path', `
            <div id="target">expired target</div>
          `)
          up.cache.expire()

          fixture('#target', { text: 'old target' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const button = e.affix(form, 'button[type=submit]', { text: 'button label' })
          const link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', { text: 'label' })

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveText('expired target')
          expect(up.network.isBusy()).toBe(true)
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()

          jasmine.respondWithSelector('#target', { text: 'revalidated target' })
          await wait()
          expect('#target').toHaveText('revalidated target')
        })
      })
    })
  })
})

