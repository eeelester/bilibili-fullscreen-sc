import { defineConfig } from 'wxt'
import { replacePublicAsset } from './replace-public-asset'
// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'B站助手，全屏显示SC，评论显示IP属地',
    permissions: ['storage', 'scripting'],
    host_permissions: ['*://*.bilibili.com/*'],
    // host_permissions: [
    //   'https://api.bilibili.com/*',
    //   'https://api.live.bilibili.com/*',
    //   'https://live.bilibili.com/*',
    // ],
    content_scripts: [
      {
        matches: ['https://*.bilibili.com/*'],
        // matches: [
        //   'https://www.bilibili.com/video/*',
        //   'https://www.bilibili.com/list/*',
        //   'https://www.bilibili.com/bangumi/play/*',
        //   'https://www.bilibili.com/opus/*',
        //   'https://www.bilibili.com/v/topic/detail*',
        //   'https://www.bilibili.com/cheese/play/*',
        //   'https://www.bilibili.com/festival/*',
        //   'https://www.bilibili.com/blackboard/*',
        //   'https://www.bilibili.com/blackroom/ban/*',
        //   'https://www.bilibili.com/read/*',
        //   'https://t.bilibili.com/*',
        //   'https://space.bilibili.com/*',
        //   'https://manga.bilibili.com/detail/*',
        //   'https://live.bilibili.com/*',
        // ],
        js: ['bilibili-web-show-ip-location.user.js'],
        run_at: 'document_start',
        world: 'MAIN',
      },
    ],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_title: 'B站助手：全屏 SC 与评论 IP 属地',
    },
  },
  webExt: {
    startUrls: ['https://live.bilibili.com/7777'],
  },
  hooks: {
    build: {
      manifestGenerated(_, manifest) {
        manifest.web_accessible_resources = [
          {
            resources: ['content-scripts/fullScreenRuntime.css'],
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
