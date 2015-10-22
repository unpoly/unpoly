describe 'up.tooltip', ->
  
  describe 'Javascript functions', ->
    
    describe 'up.tooltip.attach', ->
      
      it 'opens a tooltop above the center of the given element', ->
        $link = affix('span').text('button label')
        $link.css(
          position: 'absolute'
          left: '200px'
          top: '200px'
          width: '50px'
          height: '50px'
        )
        up.tooltip.attach($link, html: 'tooltip text')
        $tooltip = $('.up-tooltip')
        expect($tooltip).toBeInDOM()
        expect($tooltip).toHaveText('tooltip text')
        tooltipBox = up.util.measure($tooltip, relative: true)
        linkBox = up.util.measure($link, relative: true)
        expect(tooltipBox.top).toBeAround(linkBox.top - tooltipBox.height, 15)
        expect(tooltipBox.left).toBeAround(linkBox.left + 0.5 * (linkBox.width - tooltipBox.width), 15)
        
      it 'allows HTML for the tooltip text when contents are given as .html option', ->
        $link = affix('span')
        up.tooltip.attach($link, html: '<b>text</b>')
        $tooltip = $('.up-tooltip')
        expect($tooltip.html()).toEqual('<b>text</b>')

      it 'escapes HTML for the tooltip text when contents given as .html option', ->
        $link = affix('span')
        up.tooltip.attach($link, text: '<b>text</b>')
        $tooltip = $('.up-tooltip')
        expect($tooltip.html()).toEqual('&lt;b&gt;text&lt;/b&gt;')

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
      