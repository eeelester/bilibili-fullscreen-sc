# B站助手：全屏 SC 与评论 IP 属地

这是一款 Chrome 扩展，提供两个彼此独立的功能：

- 在 B 站直播的网页全屏或原生全屏模式中显示醒目留言（SC）。
- 在受支持的 B 站评论区显示接口已经返回、但网页默认未展示的 IP 属地。

评论 IP 属地功能基于 MIT 许可的 [BiliReveal](https://github.com/maxchang3/BiliReveal)，本地版本、来源与完整性校验记录见 [第三方脚本治理文档](docs/ip-location-upstream.md)。

## 本地安装

要求 Node.js 20+ 和 pnpm 9.15.9：

```bash
git clone https://github.com/eeelester/bilibili-fullscreen-sc.git
cd bilibili-fullscreen-sc
pnpm install --frozen-lockfile
pnpm build
```

打开 `chrome://extensions`，开启开发者模式，点击“加载已解压的扩展程序”，选择 `.output/chrome-mv3`。已打开的 B 站页面需要刷新后才会加载扩展。

## 开发验证

```bash
pnpm compile
pnpm lint
pnpm test -- --runInBand
pnpm test:coverage
pnpm test:e2e
pnpm build
pnpm check:bundle
pnpm check:vendor
```

扩展 E2E 使用 `pnpm test:e2e`，需要先执行 `pnpm exec puppeteer browsers install chrome` 安装 Puppeteer 对应版本的 Chrome for Testing。

## 发布状态

当前包版本为 `0.10.0`。发布前应确保 `package.json`、Git tag、扩展压缩包和 GitHub Release 使用同一版本号；详细步骤见 [发布检查清单](docs/release-checklist.md) 和 [优化执行计划](docs/optimization-execution-plan.md)。
