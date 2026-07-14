import fs from 'node:fs'
import type { ResolvedPublicFile } from 'wxt'

interface ReplacePublicAssetOptions {
  filename: string
  regex: RegExp
  replacement: string
}

export function replacePublicAsset(files: ResolvedPublicFile[], options: ReplacePublicAssetOptions) {
  const index = files.findIndex(file => file.relativeDest === options.filename)
  if (index === -1)
    return

  const file = files[index]
  const content = 'absoluteSrc' in file
    ? fs.readFileSync(file.absoluteSrc, 'utf-8')
    : file.contents

  files[index] = {
    relativeDest: file.relativeDest,
    contents: content.replace(options.regex, options.replacement),
  }
}
