function showVersions() {
  document.querySelector('.jasmine-version').innerText = `
    Jasmine ${jasmine.version}
    /
    Unpoly ${up.version}
  `
}

beforeAll(showVersions)
