import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

interface PluginOptions {
  regex: RegExp
  replacement: string
}

interface PluginReturn {
  name: string
  apply: 'build'
  closeBundle: () => void
}

export function ReplaceUnsafeWindowPlugin(options: PluginOptions): PluginReturn {
  return {
    name: 'vite-plugin-replace-unsafeWindow',
    apply: 'build',
    closeBundle() {
      const outputDir = path.resolve(process.cwd(), '.output')
      replaceOutputFile(outputDir, 'bilibili-web-show-ip-location.user.js', options)
    },
  }
}

function replaceOutputFile(dir: string, filename: string, options: PluginOptions) {
  if (!fs.existsSync(dir))
    return

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      replaceOutputFile(entryPath, filename, options)
      continue
    }

    if (entry.name !== filename)
      continue

    const content = fs.readFileSync(entryPath, 'utf-8')
    fs.writeFileSync(entryPath, content.replace(options.regex, options.replacement), 'utf-8')
  }
}
