describe 'up.tooltip', ->

  u = up.util

  describe 'JavaScript functions', ->
    
    describe 'up.tooltip.attach', ->
      
      it 'opens a tooltip with the given text', ->
        $link = affix('span')
        up.tooltip.attach($link, html: 'tooltip text')
        $tooltip = $('.up-tooltip')
        expect($tooltip).toHaveText('tooltip text')

      it 'allows HTML for the tooltip text when contents are given as { html } option', ->
        $link = affix('span')
        up.tooltip.attach($link, html: '<b>text</b>')
        $tooltip = $('.up-tooltip')
        expect($tooltip.html()).toEqual('<b>text</b>')

      it 'escapes HTML for the tooltip text when contents given as { text } option', ->
        $link = affix('span')
        up.tooltip.attach($link, text: '<b>text</b>')
        $tooltip = $('.up-tooltip')
        expect($tooltip.html()).toEqual('&lt;b&gt;text&lt;/b&gt;')

      describe 'positioning', ->

        beforeEach ->
          @$link = affix('span').text('button label')
          @$link.css(
            position: 'absolute'
            left: '200px'
            top: '200px'
            width: '50px'
            height: '50px'
          )

        beforeEach ->
          @restoreBodyHeight = u.temporaryCss('body', 'min-height': '3000px')

        afterEach ->
          @restoreBodyHeight()

        describe 'with { position: "top" }', ->

          it 'centers the tooltip above the given element', ->
            @linkBox = @$link.get(0).getBoundingClientRect()
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'top')
            $tooltip = $('.up-tooltip')
            tooltipBox = $tooltip.get(0).getBoundingClientRect()
            expect(tooltipBox.top).toBeAround(@linkBox.top - tooltipBox.height, 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left + 0.5 * (@linkBox.width - tooltipBox.width), 15)

        describe 'with { position: "right" }', ->

          it 'centers the tooltip at the right side of the given element', ->
            @linkBox = @$link.get(0).getBoundingClientRect()
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'right')
            $tooltip = $('.up-tooltip')
            tooltipBox = $tooltip.get(0).getBoundingClientRect()
            expect(tooltipBox.top).toBeAround(@linkBox.top + 0.5 * (@linkBox.height - tooltipBox.height), 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left + @linkBox.width, 15)

        describe 'with { position: "bottom" }', ->

          it 'centers the tooltip below the given element', ->
            @linkBox = @$link.get(0).getBoundingClientRect()
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'bottom')
            $tooltip = $('.up-tooltip')
            tooltipBox = $tooltip.get(0).getBoundingClientRect()
            expect(tooltipBox.top).toBeAround(@linkBox.top + @linkBox.height, 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left + 0.5 * (@linkBox.width - tooltipBox.width), 15)

        describe 'with { position: "left" }', ->

          it 'centers the tooltip at the left side of the given element', ->
            @linkBox = @$link.get(0).getBoundingClientRect()
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'left')
            $tooltip = $('.up-tooltip')
            tooltipBox = $tooltip.get(0).getBoundingClientRect()
            expect(tooltipBox.top).toBeAround(@linkBox.top + 0.5 * (@linkBox.height - tooltipBox.height), 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left - tooltipBox.width, 15)

        it 'gives the tooltip { position: "fixed" } if the given link is fixed', ->
          # Let's test the harder case where the document is scrolled
          up.layout.scroll(document, 50)
          @$link.css(position: 'fixed')
          @linkBox = @$link.get(0).getBoundingClientRect()

          up.tooltip.attach(@$link, html: 'tooltip text', position: 'top')
          $tooltip = $('.up-tooltip')
          tooltipBox = $tooltip.get(0).getBoundingClientRect()

          expect($tooltip.css('position')).toEqual('fixed')
          expect(tooltipBox.top).toBeAround(@linkBox.top - tooltipBox.height, 15)
          expect(tooltipBox.left).toBeAround(@linkBox.left + 0.5 * (@linkBox.width - tooltipBox.width), 15)


      it 'closes an existing tooltip'
      
      describe 'with position option', ->
        
        it 'anchors the tooltip at a different edge of the element'
      
    describe 'up.tooltip.close', ->

      it 'should have tests'
  
  describe 'unobtrusive behavior', ->
    
    describe '[up-tooltip]', ->

      it 'should have tests'

    describe '[up-tooltip-html]', ->

      it 'should have tests'

    describe 'when clicking on the body', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'closes the tooltip', (done) ->
        $link = affix('.link')
        up.tooltip.attach($link, text: 'Tooltip text')
        expect(up.tooltip.isOpen()).toBe(true)
        Trigger.clickSequence($('body'))
        u.nextFrame ->
          expect(up.tooltip.isOpen()).toBe(false)
          done()

      it 'closes the tooltip when a an [up-instant] link removes its parent (and thus a click event never bubbles up to the document)', (done) ->
        $parent = affix('.parent')
        $parentReplacingLink = $parent.affix('a[href="/foo"][up-target=".parent"][up-instant]')
        $tooltipOpener = affix('.link')
        up.tooltip.attach($tooltipOpener, text: 'Tooltip text')
        expect(up.tooltip.isOpen()).toBe(true)
        Trigger.clickSequence($parentReplacingLink)
        u.nextFrame ->
          expect(up.tooltip.isOpen()).toBe(false)
          done()

      it 'closes a tooltip when the user clicks on an [up-target] link outside the tooltip', (done) ->
        $target = affix('.target')
        $outsideLink = affix('a[href="/foo"][up-target=".target"]')
        $tooltipOpener = affix('.link')
        up.tooltip.attach($tooltipOpener, text: 'Tooltip text')
        expect(up.tooltip.isOpen()).toBe(true)
        Trigger.clickSequence($outsideLink)
        u.nextFrame ->
          expect(up.tooltip.isOpen()).toBe(false)
          done()

      it 'closes a tooltip when the user clicks on an [up-instant] link outside the tooltip', (done) ->
        $target = affix('.target')
        $outsideLink = affix('a[href="/foo"][up-target=".target"][up-instant]')
        $tooltipOpener = affix('.link')
        up.tooltip.attach($tooltipOpener, text: 'Tooltip text')
        expect(up.tooltip.isOpen()).toBe(true)
        Trigger.clickSequence($outsideLink)
        u.nextFrame ->
          expect(up.tooltip.isOpen()).toBe(false)
          done()
