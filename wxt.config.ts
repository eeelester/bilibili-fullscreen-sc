import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'B站SC助手',
    permissions: ['storage'],
    icons: {
      "16": "./icons/icon-able-16.png",
      "32": "./icons/icon-able-32.png",
      "48": "./icons/icon-able-48.png"
    }
  },
  runner: {
    startUrls: ["https://live.bilibili.com/7777"],
  },
});
