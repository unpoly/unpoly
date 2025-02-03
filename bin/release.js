const fs = require('fs')
const { execSync } = require('child_process')
const readline = require('readline')
const path = require('path')
const { globSync } = require('glob')
const colors = require('yoctocolors-cjs')

function getVersion() {
  const packageJsonPath = 'package.json'
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
  const packageInfo = JSON.parse(packageJsonContent)
  if (!packageInfo.version) {
    throw new Error(`Cannot parse { version } from ${packageJsonPath}`)
  }
  return packageInfo.version
}

function isPreRelease() {
  return /rc|beta|pre|alpha/.test(getVersion())
}

function run(command, optional = false) {
  console.log(colors.cyan('$ ' + command))
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    if (!optional) {
      throw new Error(`Error running command: ${command}`)
    }
  }
}

function gitTag() {
  return 'v' + getVersion()
}

function gitTagMessage() {
  return 'Version ' + getVersion()
}

function confirm(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(colors.yellow(`${message} [y/N] `), (answer) => {
      rl.close()
      if (answer.trim().toLowerCase() === 'y') {
        resolve()
      } else {
        console.log("Aborted.")
        process.exit(1)
      }
    })
  })
}

function clean() {
  const distPath = 'dist'
  if (fs.existsSync(distPath)) {
    console.log("Cleaning orphaned files...")
    console.log()
    globSync('dist/unpoly*{.css,.js}').forEach(filePath => {
      if (!paths().includes(filePath)) {
        console.log("Cleaning orphaned file: %o", filePath)
        fs.unlinkSync(filePath)
      }
    })
    console.log()
  }
}

function build() {
  console.log("Compiling a fresh build...")
  console.log()
  run('npm run build')
  console.log()
}

async function confirmRelease() {
  console.log()

  console.log(colors.bgBlue(colors.white(`You are about to ${isPreRelease() ? 'PRE-release' : 'release'} Unpoly version ${getVersion()} to npm.`)))
  console.log()
  console.log("Before continuing, make sure the following tasks are done:")
  console.log()
  console.log("- Bump the version in package.json")
  console.log("- Run `npm install` to update version in package-lock.json")
  console.log("- Update CHANGELOG.md")
  console.log("- Commit and push changes")
  console.log("- Make sure you're logged into npm")
  console.log()
  console.log("Continuing will make a fresh build and publish a new version to npm.")
  console.log()
  await confirm("Continue now?")
}

function pushTag() {
  const tag = gitTag()
  const message = gitTagMessage()
  console.log()
  run(`git push origin :refs/tags/${tag}`, true)
  run(`git tag --annotate --force --message='${message}' ${tag} HEAD`)
  run(`git push -f origin ${tag}`)
  console.log()
}

async function publishToNpm() {
  const npmTag = isPreRelease() ? 'next' : 'latest'
  const stagingDir = 'tmp/npm-staging'

  fs.rmSync(stagingDir, { recursive: true, force: true })
  fs.mkdirSync(stagingDir, { recursive: true })
  console.log(`Building NPM package in ${stagingDir} ...`)
  console.log()

  paths().forEach(file => {
    const dest = path.join(stagingDir, path.basename(file))
    fs.copyFileSync(file, dest)
  })

  console.log("Package contents:")
  console.log()
  run(`ls -l ${stagingDir}`)
  console.log()

  await confirm("Do the package contents look good?")
  const oldCwd = process.cwd()
  process.chdir(stagingDir)
  run(`npm publish --tag ${npmTag}`)
  process.chdir(oldCwd)
  console.log()
}

function paths() {
  const globs = [
    'package.json',
    'dist/unpoly{.js,.min.js}',
    'dist/unpoly.es6{.js,.min.js}',
    'dist/unpoly{.css,.min.css}',
    'dist/unpoly-migrate{.js,.min.js}',
    'dist/unpoly-bootstrap{3,4,5}{.js,.min.js}',
    'dist/unpoly-bootstrap{3,4,5}{.css,.min.css}',
    'dist/README.md',
    'dist/CHANGELOG.md',
    'dist/LICENSE'
  ]
  return globs.flatMap((file) => globSync(file))
}

async function processRelease() {
  await clean()
  await build()
  await confirmRelease()
  await pushTag()
  await publishToNpm()
  console.log()
  console.log("Now remember to:")
  console.log()
  console.log("- Make a new release to unpoly-rails with the same version")
  console.log("- Update unpoly.com (unpoly-site) so users see the updated CHANGELOG and CDN link")
  console.log("- Post an announcement about the new release to GitHub Discussions")
  console.log("- Tweet a link to the CHANGELOG as @unpolyjs")
  console.log()
}

processRelease().catch(error => {
  console.error("Error during release:", error)
  process.exit(1)
})
