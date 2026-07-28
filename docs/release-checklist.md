# 发布与商店提交检查清单

GitHub Release 与 Chrome Web Store 提交是两个独立阶段。GitHub Release 成功后，可以在不重复创建 tag 或 Release 的情况下单独重试商店提交 job。

## 0.10.0 现状审计（2026-07-28）

- `package.json`：`0.10.0`。
- `CHANGELOG.md`：存在 `0.10.0` 条目，日期为 2026-07-14。
- 远端 tag：`refs/tags/0.10.0` 存在；tag 对象 `805eae3b42fbc2c5e22dc26026bac3c7febb5b1c` 指向 release commit `9e143e2556797692a108a69243731baad6b7f2ee`。
- 本地 tag：已从 origin 获取并与上述 commit 一致。
- GitHub Release 与附件：当前环境没有 `gh`，匿名 GitHub API 返回 403，未能独立确认；需要在 GitHub Release 页面人工核对。
- Chrome Web Store：当前仓库无法读取商店后台状态，需要由具有商店权限的维护者核对。

## 发布前

1. main 分支工作区干净，目标 commit 已通过 CI 的 quality 与 Extension E2E jobs。
2. `package.json` 和 `CHANGELOG.md` 中版本一致；若版本已提前写入，工作流自动使用 `already-bumped` 路径，不再重复修改。
3. 输入精确 semver，不带 `v`，例如 `0.11.0`。
4. 默认不勾选 `submit_to_store`，先完成 GitHub Release。

## GitHub Release 阶段

1. preflight 拒绝非法、倒退或已存在的 tag。
2. zip 构建后必须恰好存在一个 `*-chrome.zip`，文件名包含目标版本且非空。
3. 工作流创建 tag 和 GitHub Release 后，再次从远端验证 tag 和附件文件名。
4. zip 同时保存为短期 GitHub Actions artifact，供商店 job 使用。

## Chrome Web Store 阶段

1. 仅提交 GitHub Release job 已验证并上传的同一个 zip。
2. 商店凭据放在 `chrome-web-store` environment secrets 中，可通过 environment protection 增加人工批准。
3. 商店失败时只重试 `Chrome Web Store submission`，不要重跑版本 bump、tag 或 GitHub Release。
4. 提交成功后人工记录商店版本、提交时间、审核状态和最终上线时间。
