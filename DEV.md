# 开发文档

## 环境与本地开发

使用 [Volta](https://volta.sh/) 管理 Node.js 和 pnpm，版本固定在 `package.json` 的 `volta` 字段中。使用 Volta 管理 pnpm 时需[启用原生支持](https://docs.volta.sh/advanced/pnpm)。CI 和发布流程使用同一 Node.js 版本。

```bash
git clone https://github.com/eeelester/bilibili-fullscreen-sc.git
cd bilibili-fullscreen-sc
export VOLTA_FEATURE_PNPM=1
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 启动 WXT 开发服务并打开 Chrome，默认访问直播间 `https://live.bilibili.com/7777`。

## 构建与打包

```bash
pnpm build
pnpm zip
```

- `pnpm build` 生成 `.output/chrome-mv3`。在 `chrome://extensions` 开启「开发者模式」，点击「加载已解压的扩展程序」并选择该目录。
- `pnpm zip` 构建并生成 `.output/bilibili-fullscreen-sc-<版本号>-chrome.zip`，用于分发或上传商店。

加载或更新扩展后，需要刷新已打开的 B 站页面。

## 开发验证

每次代码修改完成后，按顺序执行以下检查，具体要求见 [AGENTS.md](AGENTS.md)：

```bash
pnpm compile
pnpm lint
pnpm test -- --runInBand
pnpm build
pnpm test:e2e
```

push/PR CI 会执行前四项检查；浏览器回归仅在 GitHub Actions 中手动触发 `Browser regression` 工作流，本地提交前仍需运行并通过。

浏览器测试加载 `.output/chrome-mv3`，使用模拟直播接口验证全屏、播放器替换、iframe、SC 到期和设置同步。测试默认定位本机 Chrome，也可通过 `PUPPETEER_EXECUTABLE_PATH` 指定 Chrome 或 Chrome for Testing。若当前环境无法启动 Chrome，应明确记录原因，不能视为浏览器回归已通过。

## Chrome 商店发布

发布流程使用 Chrome Web Store API V2。先在仓库 Settings → Secrets and variables → Actions 中配置：

| 名称                   | 配置位置           | 用途                                           |
| ---------------------- | ------------------ | ---------------------------------------------- |
| `CHROME_EXTENSION_ID`  | Secret             | 扩展 ID                                        |
| `CHROME_CLIENT_ID`     | Secret             | OAuth 客户端 ID                                |
| `CHROME_CLIENT_SECRET` | Secret             | OAuth 客户端密钥                               |
| `CHROME_REFRESH_TOKEN` | Secret             | OAuth 刷新令牌                                 |
| `CHROME_PUBLISHER_ID`  | Variable 或 Secret | 开发者后台中的 Publisher ID；优先使用 Variable |

完成配置后：

1. 提交并推送待发布的修改。
2. 在 Actions 中打开 `Release` 工作流（`release.yml`），选择包含修改的分支，手动触发并填写目标版本号，例如 `0.11.1`。
3. 工作流验证商店访问权限，使用 release-it 更新版本与变更日志，打包并创建 Git tag 和 GitHub Release，最后上传扩展并提交审核。

版本由流水线更新，无需提前手改 `package.json`。已创建的 tag 和 GitHub Release 不代表商店审核通过；审核被拒并修复后，使用更高的版本号重新发布，保留原有 tag 和 Release。

### OAuth 配置

发布工作流使用 Chrome Web Store API V2，需要通过 OAuth 2.0 获取长期有效的 refresh token。

1. 在 Google Cloud Console 中启用 Chrome Web Store API，确认用于发布的 Google 账号拥有该扩展，且已开启两步验证。
2. 在“凭据”中创建 OAuth 客户端，应用类型选择 **Web 应用**，添加已授权重定向 URI：
   `https://developers.google.com/oauthplayground`
   可复用已有的 Web 应用客户端。
3. 打开 [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)，点击右上角齿轮，勾选 **Use your own OAuth credentials**，填入 Client ID 和 Client Secret。
4. 在 Step 1 输入 scope：
   `https://www.googleapis.com/auth/chromewebstore`
5. 使用拥有该扩展的账号完成授权，在 Step 2 点击 **Exchange authorization code for tokens**，复制返回的 `refresh_token`。
6. 同时更新 `CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`、`CHROME_REFRESH_TOKEN`。三个值必须来自同一个 OAuth 客户端，复制时不要带入空格或换行。

不要使用 OAuth Playground 的默认凭据，否则 refresh token 会在 24 小时后失效。
