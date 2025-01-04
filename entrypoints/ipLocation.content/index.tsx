export default defineContentScript({
  matches: ['https://*.bilibili.com/*'],
  runAt: 'document_start',
  main() {

    // 检查 head 是否已存在
    if (document.head) {
      initScripts();
      return;
    }

    // 如果 head 还不存在，使用 MutationObserver 监听它的出现
    const observer = new MutationObserver((_, obs) => {
      if (document.head) {
        obs.disconnect(); // 停止观察
        initScripts();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    function initScripts() {
      const proxyScript = document.createElement('script')
      // @ts-expect-error: 实际有
      proxyScript.src = browser.runtime.getURL('hook-vue3-proxy.js')

      proxyScript.onload = function () {
        console.log('Local script loaded successfully!')
        proxyScript.remove()

        const ipScript = document.createElement('script')
        // @ts-expect-error: 实际有
        ipScript.src = browser.runtime.getURL('bilibili-web-show-ip-location.user.js')

        ipScript.onload = function () {
          console.log('Local script loaded successfully!')
          ipScript.remove()
        }

        document.head.appendChild(ipScript)

      }

      document.head.appendChild(proxyScript)
    }
  },
})
