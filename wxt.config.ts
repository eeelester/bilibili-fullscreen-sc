import { defineConfig } from 'wxt'
import { replacePublicAsset } from './replace-public-asset'
// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'B站助手，全屏显示SC，评论显示IP属地',
    permissions: ['storage', 'tabs'],
    host_permissions: ['*://*.bilibili.com/*'],
    content_scripts: [
      {
        matches: ['https://*.bilibili.com/*'],
        js: ['bilibili-web-show-ip-location.user.js'],
        run_at: 'document_start',
        world: 'MAIN',
      },
    ],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
    }
  },
  webExt: {
    startUrls: ['https://live.bilibili.com/7777'],
  },
  hooks: {
    build: {
      manifestGenerated(_, manifest) {
        manifest.web_accessible_resources = [
          {
            resources: ['*.css'],
            matches: ['https://live.bilibili.com/*'],
          },
        ]
      },
      publicAssets(_, files) {
        replacePublicAsset(files, {
          filename: 'bilibili-web-show-ip-location.user.js',
          regex: /\bunsafeWindow\b/g,
          replacement: 'window',
        })
      },
    },
  },
})
