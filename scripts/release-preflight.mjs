import { appendFileSync, readFileSync } from 'node:fs'
import process from 'node:process'

const targetVersion = process.argv[2]?.replace(/^v/, '')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const currentVersion = packageJson.version
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Z.-]+)?$/i

if (!targetVersion || !semverPattern.test(targetVersion))
  throw new Error(`Invalid target version: ${targetVersion ?? 'missing'}`)

if (!semverPattern.test(currentVersion))
  throw new Error(`Invalid package version: ${currentVersion}`)

if (compareVersions(targetVersion, currentVersion) < 0)
  throw new Error(`Target version ${targetVersion} is older than package version ${currentVersion}`)

const mode = targetVersion === currentVersion ? 'already-bumped' : 'release-it'
const output = process.env.GITHUB_OUTPUT
if (output) {
  appendFileSync(output, `mode=${mode}\n`)
  appendFileSync(output, `version=${targetVersion}\n`)
}

console.log(`Release preflight passed: ${currentVersion} -> ${targetVersion} (${mode}).`)

function compareVersions(left, right) {
  const leftParts = left.split('-', 1)[0].split('.').map(Number)
  const rightParts = right.split('-', 1)[0].split('.').map(Number)

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index])
      return leftParts[index] - rightParts[index]
  }

  return left.localeCompare(right)
}
