// Jasmine 3+ runs tests in random order by default, which sometimes makes failures hard to debug.
jasmine.getEnv().configure({ random: location.search.includes('random=true') })
