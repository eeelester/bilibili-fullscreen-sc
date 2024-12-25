import { defineConfig } from 'wxt'
import { ReplaceUnsafeWindowPlugin } from './vite-plugin-replace'; // 导入自定义插件



// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'B站助手，全屏显示SC，评论显示IP属地',
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
          {
            resources: ['bilibili-web-show-ip-location.user.js'],
            matches: ['https://bilibili.com/*', 'https://*.bilibili.com/*'],
          },
        ]
      },
    },
  },
  vite: () => ({
    plugins: [
      ReplaceUnsafeWindowPlugin({
        regex: /\bunsafeWindow\b/g, // 要替换的正则
        replacement: 'window', // 替换成的新字符串
      })
    ],
  }),
})
