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

开发环境使用 [Volta](https://volta.sh/) 管理 Node.js 和 pnpm，版本固定在 `package.json` 的 `volta` 字段中。使用 Volta 管理 pnpm 时需[启用原生支持](https://docs.volta.sh/advanced/pnpm)。CI 和发布流程使用同一 Node.js 版本。

```bash
git clone
cd bilibili-fullscreen-sc
export VOLTA_FEATURE_PNPM=1
pnpm install --frozen-lockfile
pnpm build
```

打开 Chrome 浏览器，输入

- chrome://extensions

点击左上角“加载已解压的拓展程序”按钮，选择 .output/chrome-\* 文件夹即可（使用页面需要刷新才能生效）。

---

### 开发验证

push/PR CI 会执行以下检查：

```bash
pnpm compile
pnpm lint
pnpm test -- --runInBand
pnpm build
```

浏览器回归不会在 push/PR 时自动执行。涉及扩展运行时行为的修改，提交前必须执行：

```bash
pnpm build
pnpm test:e2e
```

浏览器测试加载 `.output/chrome-mv3`，使用模拟直播接口验证全屏、播放器替换、iframe、SC 到期和设置同步。测试会默认定位本机 Chrome，也可通过 `PUPPETEER_EXECUTABLE_PATH` 指定 Chrome 或 Chrome for Testing。

需要在 GitHub Actions 中补跑时，在 Actions 页面手动触发 `Browser regression` 工作流。AI 编码助手每次修改后同样必须跑通浏览器回归，具体要求见 `AGENTS.md`。

### Chrome 商店发布

发布流程使用 Chrome Web Store API V2。仓库需配置 `CHROME_EXTENSION_ID`、`CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`、`CHROME_REFRESH_TOKEN` secrets，以及 `CHROME_PUBLISHER_ID` 仓库变量（也支持同名 secret）。Publisher ID 可在 Chrome 商店开发者后台查看。

工作流会换取短期访问令牌并验证扩展访问权限，再创建版本和提交商店审核。OAuth 凭据获取步骤见 [DEV.md](DEV.md)。

### 感谢

#### 评论显示IP属地使用的是： [Web-Show-IP-Location](https://github.com/maxchang3/Bilibili-Web-Show-IP-Location)
