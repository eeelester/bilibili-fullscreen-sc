### 这是一款chrome插件，功能如下：

- 在bilibili网页上看全屏/网页全屏时直播时能够控制是否显示醒目留言（SC）
- 评论区显示IP属地（来源于[Web-Show-IP-Location](https://github.com/maxchang3/Bilibili-Web-Show-IP-Location) ）

## 安装

### Chrome 应用商店

打开Chrome浏览器

- 输入 https://chromewebstore.google.com/ ，搜索：B站助手，全屏显示SC，评论显示IP属地
- 添加到 Chrome 即可

---

### 本地安装

```bash
git clone
cd bilibili-fullscreen-sc
pnpm install
pnpm build
```

打开 Chrome 浏览器，输入

- chrome://extensions

点击左上角“加载已解压的拓展程序”按钮，选择 .output/chrome-* 文件夹即可（使用页面需要刷新才能生效）。

---

### 感谢

#### 评论显示IP属地使用的是： [Web-Show-IP-Location](https://github.com/maxchang3/Bilibili-Web-Show-IP-Location)
