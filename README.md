# B站助手

一款 Chrome 扩展，在 B 站直播全屏时显示醒目留言（SC），并在评论区显示 IP 属地。

## 功能

- 支持直播全屏和网页全屏显示 SC。
- 调整 SC 显示大小和初始位置，支持拖动和关闭留言。
- 在评论区显示 IP 属地。

## 安装

### Chrome 应用商店

1. 使用 Chrome 打开 [Chrome 应用商店](https://chromewebstore.google.com/)。
2. 搜索「B站助手，全屏显示SC，评论显示IP属地」。
3. 点击「添加至 Chrome」，按提示完成安装。

### 本地安装

1. 从 [Releases](https://github.com/eeelester/bilibili-fullscreen-sc/releases) 下载以 `-chrome.zip` 结尾的扩展包，并解压到固定目录。
2. 在 Chrome 地址栏输入 `chrome://extensions`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择解压后包含 `manifest.json` 的文件夹。

安装或更新后，刷新已打开的 B 站页面使扩展生效。

## 使用

1. 打开 B 站直播间，进入全屏或网页全屏，即可查看 SC。
2. 点击浏览器工具栏中的扩展图标，设置 SC 的初始位置和显示大小。
3. 拖动 SC 调整位置，点击留言上的关闭按钮可隐藏该条留言。

## 致谢

评论区 IP 属地功能使用 [Bilibili-Web-Show-IP-Location](https://github.com/maxchang3/Bilibili-Web-Show-IP-Location)。
