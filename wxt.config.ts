import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'B站SC助手',
    permissions: ['storage', 'tabs'],
    icons: {
      16: './icons/icon-able-16.png',
      32: './icons/icon-able-32.png',
      48: './icons/icon-able-48.png',
    },
  },
  runner: {
    startUrls: ['https://live.bilibili.com/7777'],
  },
  hooks: {
    build: {
      manifestGenerated(_, manifest: any) {
        manifest.action.default_title = '在B站看直播全屏时展示SC'
        manifest.web_accessible_resources = [
          {
            resources: ['*.css'],
            matches: ['https://live.bilibili.com/*'],
          },
        ]
      },
    },
  },
})
