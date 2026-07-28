import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import process from 'node:process'
import { gzipSync } from 'node:zlib'

const outputDir = join(process.cwd(), '.output/chrome-mv3')

if (!existsSync(outputDir)) {
  console.error('Bundle output is missing. Run `pnpm build` first.')
  process.exit(1)
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

function sizeOf(files) {
  return files.reduce((total, file) => {
    const contents = readFileSync(file)
    return {
      raw: total.raw + statSync(file).size,
      gzip: total.gzip + gzipSync(contents).byteLength,
    }
  }, { raw: 0, gzip: 0 })
}

const files = listFiles(outputDir)
const groups = [
  {
    name: 'always-loaded content script',
    files: files.filter(file => relative(outputDir, file) === 'content-scripts/fullScreen.js'),
    budget: { raw: 12_000, gzip: 5_000 },
  },
  {
    name: 'lazy fullscreen runtime',
    files: files.filter(file => relative(outputDir, file).startsWith('content-scripts/fullScreenRuntime.')),
    budget: { raw: 500_000, gzip: 180_000 },
  },
  {
    name: 'popup',
    files: files.filter(file => basename(file).startsWith('popup-') || relative(outputDir, file) === 'popup.html'),
    budget: { raw: 220_000, gzip: 75_000 },
  },
  {
    name: 'total extension',
    files,
    budget: { raw: 800_000, gzip: 300_000 },
  },
]

const format = bytes => `${(bytes / 1024).toFixed(2)} KiB`
const rows = groups.map((group) => {
  if (!group.files.length)
    throw new Error(`Bundle group is empty: ${group.name}`)

  const actual = sizeOf(group.files)
  const passed = actual.raw <= group.budget.raw && actual.gzip <= group.budget.gzip
  return { ...group, actual, passed }
})

console.table(rows.map(row => ({
  'bundle': row.name,
  'raw': format(row.actual.raw),
  'raw budget': format(row.budget.raw),
  'gzip': format(row.actual.gzip),
  'gzip budget': format(row.budget.gzip),
  'status': row.passed ? 'PASS' : 'FAIL',
})))

if (process.env.GITHUB_STEP_SUMMARY) {
  const markdown = [
    '### Extension bundle budget',
    '',
    '| Bundle | Raw | Raw budget | Gzip | Gzip budget | Status |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...rows.map(row => `| ${row.name} | ${format(row.actual.raw)} | ${format(row.budget.raw)} | ${format(row.actual.gzip)} | ${format(row.budget.gzip)} | ${row.passed ? 'PASS' : 'FAIL'} |`),
    '',
  ].join('\n')
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown)
}

if (rows.some(row => !row.passed))
  process.exit(1)
