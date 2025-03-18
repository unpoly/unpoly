function showVersions() {
  const versionString = `Jasmine ${jasmine.version} / Unpoly ${up.version}`
  document.querySelector('.jasmine-version').innerText = versionString
}

beforeAll(showVersions)
