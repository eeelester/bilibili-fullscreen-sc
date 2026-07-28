import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import process from 'node:process'

const metadata = JSON.parse(readFileSync('docs/ip-location-vendor.json', 'utf8'))
const source = readFileSync('public/bilibili-web-show-ip-location.user.js')
const sourceText = source.toString('utf8')
const actualHash = createHash('sha256').update(source).digest('hex')
const versionLine = sourceText.split('\n').find(line => line.startsWith('// @version'))
const version = versionLine?.slice('// @version'.length).trim()

if (version !== metadata.version) {
  console.error(`BiliReveal version mismatch: expected ${metadata.version}, received ${version ?? 'missing'}`)
  process.exitCode = 1
}

if (actualHash !== metadata.localSha256) {
  console.error(`BiliReveal SHA-256 mismatch: expected ${metadata.localSha256}, received ${actualHash}`)
  process.exitCode = 1
}

if (!process.exitCode)
  console.log(`BiliReveal ${version} vendor metadata verified (${actualHash.slice(0, 12)}…).`)
