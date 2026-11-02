# 001 使用 Volta 固定 Node.js 版本

状态：已接受

日期：2026-11-02

## 决策

使用 Volta 管理项目的 Node.js 版本，`package.json` 中的 `volta.node` 为版本配置的唯一来源。CI 和发布工作流通过 `actions/setup-node` 的 `node-version-file: package.json` 读取该版本。

## 范围与约束

适用于本地开发、自动化检查、构建和发布。WXT 0.21 要求 Node.js 22 以上；调整 Node.js 版本时须更新 `volta.node` 并验证安装、检查和构建流程。

## 影响

本地开发使用 Volta 自动选择项目版本。CI 和发布工作流无需分别维护 Node.js 版本号。
