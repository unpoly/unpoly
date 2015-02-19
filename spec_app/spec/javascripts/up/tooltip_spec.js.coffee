describe 'up.tooltip', ->
  
  describe 'Javascript functions', ->
    
    describe 'up.tooltip.open', ->
      
      it 'opens a tooltop above the center of the given element', ->
        $link = affix('span').text('button label')
        $link.css(
          position: 'absolute'
          left: '200px'
          top: '200px'
          width: '50px'
          height: '50px'
        )
        up.tooltip.open($link, html: 'tooltip text')
        $tooltip = $('.up-tooltip')
        expect($tooltip).toBeInDOM()
        expect($tooltip).toHaveText('tooltip text')
        tooltipBox = up.util.measure($tooltip, relative: true)
        linkBox = up.util.measure($link, relative: true)
        expect(tooltipBox.top).toBeCloseTo(linkBox.top - tooltipBox.height, 15)
        expect(tooltipBox.left).toBeCloseTo(linkBox.left + 0.5 * (linkBox.width - tooltipBox.width), 15)
        
      it 'allows HTML for the tooltip text'
        
      it 'closes an existing tooltip'
      
      describe 'with origin option', ->
        
        it 'anchors the tooltip at a different edge of the element'
      
    describe 'up.tooltip.close', ->

      it 'should have tests'
  
  describe 'unobtrusive behavior', ->
    
    describe '[up-tooltip]', ->

      it 'should have tests'
      
    describe 'body', ->
      
      it 'closes a tooltip when clicked'
      