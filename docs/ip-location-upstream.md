# BiliReveal 第三方脚本治理

`public/bilibili-web-show-ip-location.user.js` 来自 [maxchang3/BiliReveal](https://github.com/maxchang3/BiliReveal) 的 Lite release 构建，许可证为 MIT。当前导入版本、日期、来源资产、SHA-256 和本项目导入 commit 记录在 `ip-location-vendor.json`。

## 源文件维护原则

该文件是上游 release 产物，必须原样保存，不在项目中直接修补、格式化或重构。构建时，`replace-public-asset.ts` 仅在内存中的输出副本里把 userscript 的 `unsafeWindow` 标识符替换为扩展 MAIN world 中的 `window`；不会写回 `public` 源文件。

项目侧只负责以下外围治理：

1. Manifest 注入范围在 `wxt.config.ts` 中独立管理，不通过修改上游脚本 metadata 实现。
2. `pnpm check:vendor` 校验源文件版本和 SHA-256，任何直接修改都会使 CI 失败。
3. 上游脚本的运行时行为、安全修复和 SPA 兼容性通过升级 release 获得，不在本仓库制作私有补丁。

## 升级流程

1. 从元数据记录的 `sourceAsset` 下载明确版本的 release 文件到临时目录。
2. 核对 userscript 版本、metadata matches、许可证和 release 说明。
3. 用新的完整 release 文件替换旧文件，不对内容做局部编辑。
4. 更新 `ip-location-vendor.json` 的版本、日期、来源 SHA-256、本地 SHA-256 和导入 commit。
5. 运行 `pnpm check:vendor`、`pnpm lint`、`pnpm test -- --runInBand` 和 `pnpm build`。
