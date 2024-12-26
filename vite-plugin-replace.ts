import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

interface PluginOptions {
  regex: RegExp
  replacement: string
}

export function ReplaceUnsafeWindowPlugin(options: PluginOptions) {
  return {
    name: 'vite-plugin-replace-unsafeWindow',
    apply: 'build',
    closeBundle() {
      const publicDir = path.resolve(process.cwd(), 'public')
      const targetFile = path.join(publicDir, 'bilibili-web-show-ip-location.user.js')
      if (fs.existsSync(targetFile)) {
        let content = fs.readFileSync(targetFile, 'utf-8')
        content = content.replace(options.regex, options.replacement)
        fs.writeFileSync(targetFile, content, 'utf-8')
      }
    },
  }
}
