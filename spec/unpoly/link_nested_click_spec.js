extendDescribe('up.link', function() {

  extendDescribe('HTML', function() {

    describe('clicks on nested elements', function() {

      // When the user clicks an element nested in something Unpoly follows, either Unpoly follows,
      // or it steps aside so the nested element (or the browser) can handle the click.
      // The rule is that a link's content belongs to the link, while the content of a clickable container
      // (like an [up-expand] area) handles its own clicks.
      //
      // Each row is an outer element. Each column is a nested element the user clicks.
      // The cell is what happens:
      //
      //   F    Unpoly follows the outer element
      //   N    The browser follows the outer link natively (or the expanded link, for an [up-expand] area)
      //   I    The nested element handles the click, e.g. a checkbox toggles or a nested link is followed
      //   IN   The nested element handles the click, and the browser also follows the outer link
      //   0    Nothing happens
      //   -    Does not apply
      //
      // To change a cell, change the behavior on purpose and explain it in the commit.
      const matrix = `
                                    | self span label label>cb label[for] button submit checkbox text select [up-follow] a  prevented summary
        link                        | F    F    F     F        F          F      F      I        N    N      I           -  I         F
        link with method+confirm    | F    F    F     F        F          F      F      I        N    N      I           -  I         F
        link not followed           | N    N    N     I        I          IN     I      I        N    N      I           -  I         I
        area                        | F    F    0     I        I          I      I      I        0    0      I           I  I         F
        area with link not followed | N    N    0     I        I          I      I      I        0    0      I           I  I         N
        div[up-href]                | F    F    0     I        I          I      I      I        0    0      I           I  I         F
        instant link                | F    F    F     F        F          F      F      0        0    0      I           -  I         F
        instant area                | F    F    0     0        0          0      0      0        0    0      I           I  I         F
        instant div[up-href]        | F    F    0     0        0          0      0      0        0    0      I           I  I         F
      `

      const rows = {
        'link': {
          description: 'an <a up-follow>',
          html: (inner) => `<a id="outer" href="/outer" up-follow>${inner}</a>`,
        },
        'link with method+confirm': {
          // Like a Rails link with [data-method] and [data-confirm]
          description: 'an <a up-follow data-method data-confirm>',
          html: (inner) => `<a id="outer" href="/outer" up-follow data-method="delete" data-confirm="Really delete?">${inner}</a>`,
          verifyFollow(request) {
            expect(window.confirm).toHaveBeenCalledWith('Really delete?')
            // Unpoly wraps a DELETE request in a POST request with a { _method } param.
            expect(request.data()['_method']).toEqual(['DELETE'])
          },
        },
        'link not followed': {
          description: 'an <a up-follow=false>',
          html: (inner) => `<a id="outer" href="/outer" up-follow="false">${inner}</a>`,
        },
        'area': {
          description: 'an [up-expand] area',
          html: (inner) => `<div id="outer" up-expand><a href="/outer">Outer</a> ${inner}</div>`,
        },
        'area with link not followed': {
          // Unpoly hands a click on the area to the link, so the browser does what the link does.
          description: 'an [up-expand] area whose link Unpoly does not follow',
          html: (inner) => `<div id="outer" up-expand><a href="/outer" up-follow="false">Outer</a> ${inner}</div>`,
        },
        'div[up-href]': {
          description: 'a <div up-follow up-href>',
          html: (inner) => `<div id="outer" up-follow up-href="/outer">${inner}</div>`,
        },
        'instant link': {
          description: 'an <a up-follow up-instant>',
          html: (inner) => `<a id="outer" href="/outer" up-follow up-instant>${inner}</a>`,
        },
        'instant area': {
          // The area copies [up-instant] from its link.
          description: 'an [up-expand] area with an [up-instant] link',
          html: (inner) => `<div id="outer" up-expand><a href="/outer" up-follow up-instant>Outer</a> ${inner}</div>`,
        },
        'instant div[up-href]': {
          description: 'a <div up-follow up-href up-instant>',
          html: (inner) => `<div id="outer" up-follow up-href="/outer" up-instant>${inner}</div>`,
        },
      }

      const isRequested = (path) => jasmine.Ajax.requests.filter((request) => new URL(request.url, location.href).pathname === path).length > 0

      // Each column has the HTML nested in the outer element and a function telling whether the
      // nested element handled the click. The user clicks #inner, or the outer element itself.
      const columns = {
        'self': {
          description: 'the element itself',
          html: 'Text',
          target: '#outer',
        },
        'span': {
          description: 'a <span>',
          html: '<span id="inner">Text</span>',
        },
        'label': {
          description: 'a <label> without a control',
          html: '<label id="inner">Label</label>',
        },
        'label>cb': {
          description: 'a <label> around a checkbox',
          html: '<label id="inner"><input type="checkbox" id="checkbox"> Label</label>',
          handled: () => document.querySelector('#checkbox').checked,
        },
        'label[for]': {
          description: 'a <label for> for a checkbox outside the element',
          html: '<label id="inner" for="checkbox">Label</label>',
          cell: (outerHTML) => `${outerHTML} <input type="checkbox" id="checkbox">`,
          handled: () => document.querySelector('#checkbox').checked,
        },
        'button': {
          description: 'a <button type=button>',
          html: '<button type="button" id="inner">Button</button>',
          setup() {
            // Unpoly halts a click that it follows, so a delegated listener only sees a click that Unpoly left alone.
            const listener = jasmine.createSpy('button click listener')
            up.on('click', '#inner', listener)
            return () => listener.calls.any()
          },
        },
        'submit': {
          description: 'a submit button of a form around the element',
          html: '<button type="submit" id="inner">Save</button>',
          cell: (outerHTML) => `<form method="post" action="/form" up-submit>${outerHTML}</form>`,
          handled: () => isRequested('/form'),
        },
        'checkbox': {
          description: 'a checkbox',
          html: '<input type="checkbox" id="inner">',
          handled: () => document.querySelector('#inner').checked,
        },
        'text': {
          description: 'a text field',
          html: '<input type="text" id="inner">',
        },
        'select': {
          description: 'a <select>',
          html: '<select id="inner"><option>Option</option></select>',
        },
        '[up-follow]': {
          description: 'a nested [up-follow] element',
          html: '<span id="inner" up-follow up-href="/nested">Nested</span>',
          handled: () => isRequested('/nested'),
        },
        'a': {
          // An <a> cannot be nested in another <a>.
          description: 'a nested link',
          html: '<a id="inner" href="/nested" up-follow>Nested</a>',
          handled: () => isRequested('/nested'),
        },
        'prevented': {
          description: 'an element whose script prevents up:click',
          html: '<span id="inner">Custom</span>',
          setup(inner) {
            const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
            inner.addEventListener('up:click', listener)
            return () => listener.calls.any()
          },
        },
        'summary': {
          // A <summary> is not a better target than its container, not even in an [up-expand] area.
          description: 'a <summary>',
          html: '<details><summary id="inner">Summary</summary>Details</details>',
          handled: () => document.querySelector('details').open,
        },
      }

      const outcomeDescriptions = {
        'F': 'follows the element',
        'N': 'lets the browser follow the link',
        'I': 'lets the nested element handle the click',
        'IN': 'lets the nested element handle the click, and the browser follow the link',
        '0': 'does nothing',
      }

      // Tells what happened after the click, as a cell value.
      function observe(row, handled) {
        let outcome = ''

        let followRequest = jasmine.Ajax.requests.filter((request) => new URL(request.url, location.href).pathname === '/outer')[0]
        if (followRequest) {
          row.verifyFollow?.(followRequest)
          outcome += 'F'
        }

        if (handled()) {
          outcome += 'I'
        }

        let nativelyFollowed = window.defaultFollowedLinks.filter((link) => link.getAttribute('href') === '/outer')
        if (nativelyFollowed.length) {
          // Consume the links so the spec runner does not fail the spec for an unhandled click.
          for (let link of nativelyFollowed) {
            expect(link).toHaveBeenDefaultFollowed()
          }
          outcome += 'N'
        }

        return outcome || '0'
      }

      const [header, ...rowLines] = matrix.trim().split('\n').map((line) => line.split('|').map((part) => part.trim()))
      const columnKeys = header[1].split(/\s+/)

      for (let [rowKey, rowCells] of rowLines) {
        let row = rows[rowKey]
        let cells = rowCells.split(/\s+/)

        describe(`within ${row.description}`, function() {

          columnKeys.forEach(function(columnKey, index) {
            let column = columns[columnKey]
            let expected = cells[index]
            if (expected === '-') return

            it(`${outcomeDescriptions[expected]} when the user clicks ${column.description}`, async function() {
              spyOn(window, 'confirm').and.returnValue(true)

              let outerHTML = row.html(column.html)
              let [container] = htmlFixtureList(`<div>${column.cell ? column.cell(outerHTML) : outerHTML}</div>`)
              up.hello(container)

              let target = document.querySelector(column.target || '#inner')
              let handled = column.setup ? column.setup(target) : (column.handled || (() => false))

              Trigger.clickSequence(target)
              await wait()

              expect(observe(row, handled)).toBe(expected)
            })
          })

        })
      }

    })

  })

})
