describe 'up.tooltip', ->
  
  describe 'Javascript functions', ->
    
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
          @linkBox = up.util.measure(@$link, relative: true)

        describe 'with { position: "top" }', ->

          it 'centers the tooltip above the given element', ->
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'top')
            $tooltip = $('.up-tooltip')
            tooltipBox = up.util.measure($tooltip, relative: true)
            expect(tooltipBox.top).toBeAround(@linkBox.top - tooltipBox.height, 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left + 0.5 * (@linkBox.width - tooltipBox.width), 15)

        describe 'with { position: "right" }', ->

          it 'centers the tooltip at the right side of the given element', ->
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'right')
            $tooltip = $('.up-tooltip')
            tooltipBox = up.util.measure($tooltip, relative: true)
            expect(tooltipBox.top).toBeAround(@linkBox.top + 0.5 * (@linkBox.height - tooltipBox.height), 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left + @linkBox.width, 15)

        describe 'with { position: "bottom" }', ->

          it 'centers the tooltip below the given element', ->
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'bottom')
            $tooltip = $('.up-tooltip')
            tooltipBox = up.util.measure($tooltip, relative: true)
            expect(tooltipBox.top).toBeAround(@linkBox.top + @linkBox.height, 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left + 0.5 * (@linkBox.width - tooltipBox.width), 15)

        describe 'with { position: "left" }', ->

          it 'centers the tooltip at the left side of the given element', ->
            up.tooltip.attach(@$link, html: 'tooltip text', position: 'left')
            $tooltip = $('.up-tooltip')
            tooltipBox = up.util.measure($tooltip, relative: true)
            expect(tooltipBox.top).toBeAround(@linkBox.top + 0.5 * (@linkBox.height - tooltipBox.height), 15)
            expect(tooltipBox.left).toBeAround(@linkBox.left - tooltipBox.width, 15)

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

    describe 'body', ->
      
      it 'closes a tooltip when clicked'
      