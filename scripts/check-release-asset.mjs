import { appendFileSync, readdirSync, statSync } from 'node:fs'
import process from 'node:process'

const version = process.argv[2]?.replace(/^v/, '')
if (!version)
  throw new Error('A release version is required')

const assets = readdirSync('.output')
  .filter(filename => filename.endsWith(`-${version}-chrome.zip`))

if (assets.length !== 1)
  throw new Error(`Expected exactly one Chrome zip, received ${assets.length}: ${assets.join(', ')}`)

const asset = `.output/${assets[0]}`
if (statSync(asset).size === 0)
  throw new Error(`Release asset is empty: ${asset}`)

if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `asset=${asset}\n`)

console.log(`Release asset verified: ${asset}`)
