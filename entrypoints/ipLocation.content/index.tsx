

export default defineContentScript({
  matches: ['https://bilibili.com/*', 'https://*.bilibili.com/*'],
  main() {
    const script = document.createElement("script");
    // @ts-ignore: 实际有
    script.src = browser.runtime.getURL("bilibili-web-show-ip-location.user.js"); // 根据实际路径调整

    script.onload = function () {
      console.log("Local script loaded successfully!");
      script.remove();
    };

    document.head.appendChild(script);
  },
})
