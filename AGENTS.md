# AGENTS.md

## 修改完成标准

每次代码修改完成后，必须依次执行并通过：

```bash
pnpm compile
pnpm lint
pnpm test -- --runInBand
pnpm build
pnpm test:e2e
```

浏览器回归不在 push/PR CI 中自动执行，但本地修改必须运行并通过。若当前环境确实无法启动 Chrome，必须明确说明未执行的原因，不能将浏览器回归视为已通过。

GitHub Actions 中的 `Browser regression` 工作流只用于手动补跑，不作为提交前的替代验证。
