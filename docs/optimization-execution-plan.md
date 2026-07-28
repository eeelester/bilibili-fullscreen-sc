# Bilibili Fullscreen SC 优化执行计划

> 文档状态：待执行
> 制定日期：2026-07-28
> 适用版本：v0.10.0 及后续版本
> 原则：先建立回归保护，再修正确性问题，然后优化性能、安全性和工程质量。

## 1. 目标

本计划用于系统性解决当前项目中已确认或风险较高的问题，主要目标如下：

1. 修复播放器重建、全屏模式切换和 iframe 变化时的挂载状态错误。
2. 降低直播页面常驻 CPU、内存和脚本加载成本。
3. 提升 B 站 API、WBI 签名和 WebSocket 初始化链路的可靠性。
4. 建立覆盖核心生命周期的自动化测试和可持续质量门禁。
5. 收窄扩展权限、敏感日志和 MAIN world 脚本的影响范围。
6. 改善 SC 数据一致性、设置同步、拖动体验和无障碍能力。
7. 清理技术债，分阶段升级依赖并修复发布流程的一致性。

## 2. 非目标

本轮优化不包含以下事项：

- 不重写整个扩展或更换 React/WXT 技术栈。
- 不新增与现有产品定位无关的大型功能。
- 不在缺少回归测试的情况下同时升级多个核心依赖的大版本。
- 不自行修改或重新设计 B 站协议；协议相关变更必须先通过真实页面验证。
- 不在未验证兼容性的情况下移除 iframe 支持、WBI 签名或 WebSocket token。

## 3. 当前基线

执行优化前应保留以下基线，后续阶段均以此作为对比依据：

| 项目                    | 当前结果                        |
| ----------------------- | ------------------------------- |
| TypeScript 编译         | 通过                            |
| ESLint                  | 通过                            |
| Jest                    | 2 个套件通过，1 个 E2E 套件跳过 |
| 自动化测试              | 3 个通过，1 个跳过              |
| Statements/Lines 覆盖率 | 13.83%                          |
| 生产构建总体积          | 650.72 kB                       |
| 全屏内容脚本            | 432.56 kB，gzip 约 154 kB       |
| Popup 脚本              | 176.53 kB，gzip 约 56 kB        |

每个里程碑完成后至少运行：

```bash
pnpm compile
pnpm lint
pnpm test -- --runInBand
pnpm build
```

涉及浏览器行为的阶段还必须运行对应的扩展集成测试和人工冒烟测试。

## 4. 优先级和规模定义

| 标记 | 含义                                           |
| ---- | ---------------------------------------------- |
| P0   | 已确认的正确性问题或可能造成主要功能失效的问题 |
| P1   | 高收益性能、安全、可靠性或测试优化             |
| P2   | 可维护性、体验和工程质量优化                   |
| S    | 预计不超过半天                                 |
| M    | 预计约 1～2 天                                 |
| L    | 预计约 3～5 天，需要拆分提交                   |

工期仅用于控制任务颗粒度，不作为固定发布日期承诺。

## 5. 总体执行顺序

```text
M0 基线与回归用例
  ↓
M1 全屏和播放器生命周期
  ↓
M2 常驻性能与按需加载
  ↓
M3 API、WBI 与 WebSocket 初始化
  ↓
M4 SC 数据、设置与交互体验
  ↓
M5 权限、MAIN world 与样式隔离
  ↓
M6 类型、依赖和工程质量
  ↓
M7 发布流程、文档与最终验收
```

M0～M3 应优先完成。M4 和 M5 可以在 M3 完成后并行设计，但合并时仍需分别验证。

## 6. 里程碑 M0：建立基线与回归保护

### OPT-001：整理测试分层和公共 fixture

- 优先级：P1
- 规模：M
- 涉及文件：`tests/`、`dev/testData.js`、`tests/testData.ts`、`jest.config.js`
- 依赖：无

执行内容：

1. 将纯函数单测、React 组件测试、浏览器扩展集成测试明确分组。
2. 合并重复的 SC 测试数据，建立最小、类型化 fixture。
3. Popup 预览数据和测试数据分离，生产包不再直接使用大型 dev fixture。
4. 为测试订阅 EventBus 时提供统一清理逻辑，避免断言失败后污染其他用例。

验收标准：

- 测试 fixture 只有一个权威数据结构定义。
- Popup 生产构建不再包含无关的大型开发测试数据。
- 现有 3 个单元测试继续通过。

### OPT-002：先补全屏生命周期回归测试

- 优先级：P0
- 规模：L
- 涉及文件：`entrypoints/fullScreen.content/`、`tests/`
- 依赖：OPT-001

至少新增以下用例：

1. 原生全屏进入和退出只 mount/unmount 一次。
2. 网页全屏进入和退出只 mount/unmount 一次。
3. 全屏期间替换 video 后仍能正确退出。
4. 播放器父节点整体替换后能重新发现 video。
5. mount 时不存在 video 不应进入已挂载状态。
6. iframe 播放器重建后重新挂载样式和 UI。
7. 原生全屏与网页全屏互相切换不产生重复 Root 或 WebSocket。
8. 快速进入、退出时旧异步初始化结果不得污染新会话。

验收标准：

- 每个已知故障场景在修改生产代码前至少有一个会失败的回归测试。
- 测试不依赖真实 B 站网络接口。
- MutationObserver、ResizeObserver、Fullscreen API 和 WebSocket 均可替换为测试桩。

### OPT-003：修复并启用扩展 E2E 框架

- 优先级：P1
- 规模：M
- 涉及文件：`tests/index.test.ts`、`jest.config.js`、`.github/workflows/ci.yml`
- 依赖：OPT-001

执行内容：

1. 将扩展路径从失效的 `dist` 改为实际构建目录。
2. 去掉永久 `describe.skip`，将 E2E 作为独立脚本运行。
3. 增加可靠的浏览器关闭和测试超时清理。
4. 使用本地测试页面模拟播放器结构，真实 B 站只保留人工冒烟测试。
5. 评估在 CI 中使用 headless Chrome 或 xvfb 运行 MV3 扩展测试。

验收标准：

- 本地可以通过单一命令完成 build + E2E。
- E2E 失败时不会遗留 Chrome 进程。
- CI 至少能验证扩展加载、Popup 打开和内容脚本挂载。

## 7. 里程碑 M1：全屏和播放器生命周期重构

### OPT-101：建立统一显示状态机

- 优先级：P0
- 规模：L
- 涉及文件：`observePageFullScreen.tsx`、`index.tsx`、`utils.tsx`
- 依赖：OPT-002

建议状态：

```text
normal
page-fullscreen
native-fullscreen
```

执行内容：

1. ResizeObserver 和 fullscreenchange 只上报事实，不直接各自维护挂载状态。
2. 统一计算当前播放器、全屏模式和目标 Document。
3. 状态变化后由单一控制器执行 mount/unmount。
4. 连续收到相同状态时不重复执行副作用。
5. 删除依赖观察器局部变量的 `lastTimePageFullScreen` 判断。

验收标准：

- video 替换后退出网页全屏能够正确卸载。
- 两种全屏模式切换不会重复创建 React Root 或 WebSocket。
- 状态转换可以通过纯函数或独立控制器测试。

### OPT-102：重构播放器发现和观察器生命周期

- 优先级：P0
- 规模：L
- 涉及文件：`observePageFullScreen.tsx`、`utils.tsx`
- 依赖：OPT-101

执行内容：

1. 使用 MutationObserver 或带退避的有限查询替代永久 rAF 轮询。
2. 观察稳定的播放器根节点或 document，支持父节点整体替换。
3. 保存所有 MutationObserver、ResizeObserver 和等待任务的清理函数。
4. 旧 video 断开时停止观察，并重新寻找新 video。
5. iframe 变化时重新判断 Document、样式和挂载目标。

验收标准：

- 无 video 页面不会持续每帧查询 DOM。
- 旧播放器节点被移除后不残留观察器和 UI 引用。
- 同一时刻最多有一个有效 ResizeObserver 观察当前 video。

### OPT-103：让 mount/unmount 具备事务性

- 优先级：P0
- 规模：M
- 涉及文件：`utils.tsx`
- 依赖：OPT-101、OPT-102

执行内容：

1. 只有挂载节点成功插入 DOM 后才进入 mounted 状态。
2. `createRoot`、render 或样式注入失败时完整回滚。
3. `hasMountElement` 同时检查状态、DOM `isConnected` 和 Root。
4. 用结构化状态替代 `ALREADY_HAVE_IT` 魔法字符串。
5. unmount 必须幂等，并清理 Root、DOM、请求、WebSocket 和观察器。

验收标准：

- 任意步骤抛错后都允许下一次重新 mount。
- 连续调用 unmount 不抛错。
- DOM 被宿主页面主动移除后可以自动恢复或安全回到未挂载状态。

## 8. 里程碑 M2：常驻性能与按需加载

### OPT-201：拆分轻量入口和功能主体

- 优先级：P1
- 规模：L
- 涉及文件：`entrypoints/fullScreen.content/`、`wxt.config.ts`
- 依赖：OPT-103

执行内容：

1. 内容脚本入口只保留播放器检测、全屏状态和消息桥接。
2. 首次真正需要显示 SC 时再动态加载 React UI、WebSocket 和 WBI 模块。
3. 验证 WXT 对内容脚本动态 chunk 和 web accessible resources 的处理。
4. 加载中发生退出时不得继续 mount。
5. 对懒加载失败提供可重试路径。

验收标准：

- 普通直播页面不提前初始化 React Root 或 WebSocket 模块。
- 入口 gzip 体积显著低于当前约 154 kB 的完整内容脚本。
- 首次进入全屏没有明显功能回退或重复加载。

### OPT-202：用到期定时器替代永久 useRAF

- 优先级：P1
- 规模：M
- 涉及文件：`components/ScList/hook.ts`、`components/ScList/index.tsx`
- 依赖：无，可与 OPT-201 同期执行

执行内容：

1. 根据最早 SC 过期时间安排一个 timeout。
2. 列表新增、删除或到期后重新安排下一次清理。
3. 页面恢复可见时立即补做一次清理。
4. CSS 继续独立负责进度条动画。

验收标准：

- 空列表时没有持续 rAF 或 timer 循环。
- SC 在允许误差内准时消失。
- 多条 SC 同时存在时不会为每条创建高频任务。

### OPT-203：增加包体预算

- 优先级：P1
- 规模：S
- 涉及文件：`package.json`、`.github/workflows/ci.yml`
- 依赖：OPT-201

执行内容：

1. 记录入口、懒加载主体、Popup 和总包体的原始及 gzip 体积。
2. CI 中比较包体预算，超出阈值时失败或告警。
3. 预算以优化完成后的实际基线制定，并允许小幅波动。

验收标准：

- 每次 PR 可以看到核心 bundle 的体积变化。
- 新增大型依赖不能静默进入常驻入口。

## 9. 里程碑 M3：API、WBI 与 WebSocket 初始化

### OPT-301：加入请求取消和会话边界

- 优先级：P1
- 规模：M
- 涉及文件：`utils.tsx`、`wbi.ts`
- 依赖：OPT-103

执行内容：

1. 每次 mount 创建独立 AbortController。
2. unmount 和新 mount 开始时取消旧请求。
3. fetch、WBI 和后续初始化统一接收 signal。
4. AbortError 不作为初始化故障输出。
5. 保留 mount session ID 作为第二层防护。

验收标准：

- 快速退出全屏后没有继续发起后续 API 请求。
- 旧会话永远不能覆盖新会话的 WebSocket 和 UI。

### OPT-302：并行化初始化并缓存 WBI key

- 优先级：P1
- 规模：M
- 涉及文件：`utils.tsx`、`wbi.ts`
- 依赖：OPT-301

执行内容：

1. 房间号确定后，并行执行互不依赖的请求。
2. WBI 完成后立即发起 token 请求，不等待历史 SC 处理完成。
3. 缓存 WBI key，并设置合理过期时间。
4. 签名失败时仅刷新一次 key 后重试。
5. `encWbi` 不再修改调用方传入对象。

验收标准：

- 初始化关键路径请求数量不增加。
- 再次进入全屏时可以复用有效 WBI key。
- 初始化耗时有可重复的对比数据。

### OPT-303：验证并减少账号信息请求

- 优先级：P1
- 规模：S/M
- 涉及文件：`utils.tsx`
- 依赖：OPT-301

执行内容：

1. 在登录和未登录环境分别验证 `uid=0` 建立连接的稳定性。
2. 若稳定，移除 `/x/member/web/account` 请求。
3. 若必须提供 mid，则只在需要时请求，并记录用途和隐私说明。

验收标准：

- 登录和未登录用户都能正常接收 SC。
- 不影响 WebSocket 重连。
- 不再请求无实际用途的账户数据。

### OPT-304：完善 API 运行时校验和错误策略

- 优先级：P1
- 规模：M
- 涉及文件：`types.d.ts`、`utils.tsx`、`wbi.ts`
- 依赖：OPT-301

执行内容：

1. 校验 HTTP 状态、业务 code 和必要字段。
2. 区分网络错误、风控、接口结构变化、认证失败和主动取消。
3. 对临时错误进行有限次数指数退避；4xx 和结构错误不盲目重试。
4. 外部响应使用轻量类型守卫，不为此引入大型运行时依赖。

验收标准：

- 缺失字段不会导致深层解构异常。
- 错误日志不包含 token、签名、完整用户消息或 mid。
- 失败后可以在下一次进入全屏时恢复。

## 10. 里程碑 M4：SC 数据、设置与交互体验

### OPT-401：SC 去重和删除记录治理

- 优先级：P1
- 规模：M
- 涉及文件：`components/ScList/index.tsx`、`utils/index.ts`
- 依赖：OPT-001

执行内容：

1. 使用内存 Set/Map 按 SC ID 去重。
2. 处理历史 SC 与实时 SC 的重叠。
3. sessionStorage 读取增加 try/catch、版本和默认值。
4. 删除记录按房间隔离并设置长度或过期上限。
5. 校验 `time`、`delay`、颜色、图片 URL 和消息长度。

验收标准：

- 重复 ID 不产生重复 React key。
- sessionStorage 被修改或损坏时组件仍能工作。
- 删除记录不会无限增长，也不会错误影响其他房间。

### OPT-402：集中管理设置并支持多标签同步

- 优先级：P1
- 规模：M
- 涉及文件：`entrypoints/popup/app.tsx`、`components/RadioGroup/`、`components/ScList/`
- 依赖：无

执行内容：

1. 集中定义 storage key、类型、默认值和校验器。
2. Popup 并行读取全部设置，避免多个组件重复获取。
3. 使用 storage change/watch 同步所有已打开的直播页面。
4. 防止初始异步读取覆盖用户刚完成的操作。
5. 保存失败时在 Popup 提供可见反馈。

验收标准：

- 一个 Popup 设置变化能够同步到所有已加载的直播页。
- 不需要依赖 `tabs` 权限读取敏感 tab 字段。
- 快速操作不会被旧的异步读取覆盖。

### OPT-403：修复拖动边界并使用 Pointer Events

- 优先级：P2
- 规模：M
- 涉及文件：`components/ScList/hook.ts`、`components/ScList/index.tsx`
- 依赖：无

执行内容：

1. 修复坐标为 0 时被当成 false 的判断。
2. pointerdown 时立即记录起点，只响应主按钮。
3. 使用 Pointer Events 和 pointer capture。
4. 增加明确拖动手柄，避免和滚动、关闭按钮竞争。
5. 根据视口尺寸约束位置，resize 后重新校正。

验收标准：

- 鼠标、触控板和触屏行为一致。
- UI 不能被完全拖出可视区域。
- 点击关闭按钮不会触发拖动。

### OPT-404：完善无障碍和动效偏好

- 优先级：P2
- 规模：M
- 涉及文件：`components/RadioGroup/`、`components/ScList/`、`entrypoints/popup/`
- 依赖：OPT-403

执行内容：

1. Radio input 使用真实 id、label 和 onChange。
2. Popup 使用 fieldset/legend 或 label 的正确组合。
3. 关闭图片改为 button，并提供 aria-label。
4. 增加可见 `:focus-visible` 样式。
5. 支持 `prefers-reduced-motion`。

验收标准：

- Popup 可以只用键盘完成设置。
- 关闭按钮可聚焦和触发。
- 减少动效偏好下不播放非必要过渡动画。

## 11. 里程碑 M5：权限、MAIN world 与样式隔离

### OPT-501：收窄 Manifest 权限和匹配范围

- 优先级：P1
- 规模：M
- 涉及文件：`wxt.config.ts`
- 依赖：OPT-402

执行内容：

1. 验证并移除不必要的 `tabs` 权限。
2. 将 host permissions 从任意 scheme 收窄为 HTTPS 和实际 API 域名。
3. 将 IP 脚本 matches 收窄到真正支持的 B 站页面。
4. `web_accessible_resources` 使用具体资源路径。
5. 设置正式 action title，并确认 128px icon 是否需要写入 manifest。

验收标准：

- 安装权限提示不包含无实际用途的权限。
- Popup 仍可向当前直播页发送或同步设置。
- 所有必要 API 和内容脚本页面仍可工作。

### OPT-502：治理第三方 IP 属地脚本

- 优先级：P1
- 规模：L
- 涉及文件：`public/bilibili-web-show-ip-location.user.js`、`replace-public-asset.ts`、`README.md`
- 依赖：OPT-501

执行内容：

1. 记录上游版本、commit/hash、许可证和本地转换步骤。
2. 为 Proxy、customElements.define 和全局属性 Hook 增加幂等保护。
3. 为等待元素和 MutationObserver 增加超时、路由退出和清理。
4. 能使用 textContent 的地方不使用 innerHTML；必须拼接 HTML 时明确转义。
5. 增加更新脚本或检查流程，升级时输出上游差异。
6. 针对 B 站 SPA 路由变化重新执行或清理对应 Hook。

验收标准：

- 同一 Hook 重复执行不会形成多层 Proxy。
- 不支持的页面不会长期保留观察器。
- 外部 location 字段不能作为未转义 HTML 插入。
- 可以追溯当前 public 文件来自哪个上游版本。

### OPT-503：隔离 SC 样式

- 优先级：P1
- 规模：M/L
- 涉及文件：`components/ScList/`、内容脚本挂载代码
- 依赖：OPT-103

优先方案：Shadow DOM。若 iframe 或 WXT 构建限制导致不可行，则使用统一前缀或 CSS Modules。

验收标准：

- 不再向宿主页面暴露 `.container`、`.content`、`.name` 等通用选择器。
- B 站常见主题样式不会覆盖 SC UI。
- iframe 和普通播放器场景均通过视觉回归检查。

### OPT-504：清理生产日志和隐私暴露

- 优先级：P1
- 规模：S
- 涉及文件：`utils.tsx`、`wbi.ts`、Popup 代码
- 依赖：无

执行内容：

1. 永久移除 token、WBI 签名和 mid 日志。
2. 其他调试日志由显式 debug 开关控制。
3. 错误日志仅保留阶段、错误类别和必要状态。
4. README 增加权限和数据访问说明。

验收标准：

- 默认生产控制台不输出敏感数据和完整 SC 内容。
- debug 模式关闭时仅保留真正需要用户感知的错误。

## 12. 里程碑 M6：类型、依赖和工程质量

### OPT-601：逐步加强 TypeScript

- 优先级：P1
- 规模：L
- 涉及文件：`tsconfig.json`、`utils/`、`entrypoints/`、`components/`
- 依赖：OPT-304、OPT-401、OPT-402

推荐顺序：

1. 浏览器消息类型和运行时校验。
2. 类型化 EventBus。
3. 类型化 storage 定义。
4. API 成功/失败响应类型。
5. 移除索引签名 `any` 和无效 `@ts-expect-error`。
6. 开启 `noImplicitAny`，再评估其他严格选项。

验收标准：

- `noImplicitAny` 开启并通过编译。
- EventBus 事件名和参数类型能够一一对应。
- 普通模块类型不再滥用 `.d.ts` 文件。

### OPT-602：清理未使用依赖

- 优先级：P2
- 规模：S
- 涉及文件：`package.json`、`pnpm-lock.yaml`、未使用资源
- 依赖：无

首批检查对象：

- `rc-switch`
- `@types/rc-switch`
- `@types/testing-library__jest-dom`
- 未引用的 disable icons
- 重复 fixture 和过时开发脚本

验收标准：

- 每个直接依赖都有明确代码用途。
- 删除后 compile、test、build 全部通过。

### OPT-603：分阶段升级核心依赖

- 优先级：P2
- 规模：L，拆成多个 PR
- 涉及文件：`package.json`、`pnpm-lock.yaml`
- 依赖：OPT-003、OPT-203、OPT-602

推荐顺序：

1. WXT 和 React module。
2. Puppeteer 和 E2E 基础设施。
3. ESLint、lint-staged、Husky 和 release-it。
4. TypeScript、Jest 和 ts-jest。
5. 单独评估 React 19，不与前述升级混合。

`bilibili-live-ws` 应通过项目内适配层隔离；在找到稳定替代方案前不直接重写协议实现。

验收标准：

- 每个升级 PR 只覆盖一个依赖域。
- 有 lockfile、构建产物和浏览器回归对比。
- 包体、权限和功能不能出现未解释退化。

### OPT-604：加强 CI 和提交门禁

- 优先级：P2
- 规模：M
- 涉及文件：`.github/workflows/ci.yml`、`.husky/pre-commit`、`package.json`、`eslint.config.js`
- 依赖：OPT-003、OPT-203

执行内容：

1. lint-staged 覆盖根配置、tests、dev 和样式文件。
2. tests 不再被 ESLint 整体忽略。
3. CI 增加 coverage、E2E、包体预算和构建产物检查。
4. 增加 concurrency、timeout 和失败诊断输出。
5. `package.json` 声明支持的 Node 版本。
6. 评估将 GitHub Actions 固定到 commit SHA。

验收标准：

- PR 上可以一次看到编译、Lint、单测、E2E、覆盖率和包体状态。
- 同一分支的新提交会取消旧 CI。

## 13. 里程碑 M7：发布、文档与最终验收

### OPT-701：修复版本、tag 和 Release 一致性

- 优先级：P1
- 规模：M
- 涉及文件：`.release-it.json`、`.github/workflows/release.yml`
- 依赖：OPT-604

首先人工核实 v0.10.0 在远端的 tag、GitHub Release 和商店提交状态，避免仅根据本地标签推断远端结果。

执行内容：

1. 发布前验证工作区、目标版本和 CI 状态。
2. 发布中验证 zip 文件存在且名称唯一。
3. 发布后验证 commit、tag、GitHub Release 和附件。
4. 商店提交与 GitHub Release 分阶段记录，失败时支持安全重试。
5. 避免重复 bump 已经写入 package.json 的版本。

验收标准：

- package version、CHANGELOG、tag、Release 标题和 zip 版本一致。
- 任一阶段失败都能明确知道可以从哪里重试。

### OPT-702：补全文档和产品状态说明

- 优先级：P2
- 规模：S/M
- 涉及文件：`README.md`、`docs/`
- 依赖：前述功能任务完成后更新

执行内容：

1. 补全 clone 地址和本地开发、测试、构建命令。
2. 列出支持的页面、全屏模式和已知限制。
3. 说明扩展权限、B 站 API、登录信息和数据处理方式。
4. 明确 IP 属地脚本的来源和更新方式。
5. 明确是否支持启用/禁用 SC；若不支持，清理相关依赖和图标暗示。
6. 修复 Popup 默认标题和商店展示信息。

验收标准：

- 新贡献者只根据 README 即可安装、测试和构建。
- 用户可以理解扩展访问了哪些数据及原因。

### OPT-703：最终回归和发布候选验收

- 优先级：P1
- 规模：M
- 依赖：所有计划发布的任务

测试环境至少包括：

- Chrome 当前稳定版。
- 登录和未登录状态。
- 普通直播间、带 iframe 的直播间、直播首页。
- 原生全屏和网页全屏。
- 切换清晰度、切换直播间、SPA 导航。
- 多标签页同时打开直播。
- 有历史 SC、实时 SC、重复 SC、无 SC。
- 网络断开、API 失败和 WebSocket 重连。

发布门槛：

- compile、lint、unit、component、E2E、build 全部通过。
- 无 P0/P1 未解决回归。
- 内容入口体积和常驻 CPU 相比基线没有退化。
- 权限、隐私说明和 manifest 与实际行为一致。
- Git 工作区干净，版本和发布产物一致。

## 14. 建议的提交和 PR 规则

1. 每个 PR 对应一个 OPT 编号或一个紧密相关的小组。
2. 正确性修复必须先提交失败回归用例，再提交修复。
3. 不在功能重构 PR 中混入依赖大版本升级。
4. 不在依赖升级 PR 中顺手修改产品行为。
5. 每个 PR 描述必须包含：
   - 问题和影响范围；
   - 解决方案；
   - 测试方法；
   - 包体或性能影响；
   - 风险和回滚方式。
6. P0/P1 修改合并前至少进行一次真实直播页人工冒烟测试。

## 15. 风险和回滚策略

### B 站页面结构变化

- 风险：DOM 选择器、iframe 和评论区内部实现随时可能变化。
- 控制：选择器集中管理；优先观察稳定根节点；失败时安全停用而不是无限轮询。
- 回滚：保留旧观察方案的独立版本提交，但不要长期维护两套同时运行的监听器。

### 懒加载内容脚本

- 风险：WXT/Chrome 对动态 chunk 和资源访问有约束。
- 控制：先做最小技术验证，再迁移主逻辑；构建后检查 manifest 和实际扩展加载。
- 回滚：恢复单 bundle 入口，但保留有限观察和状态机优化。

### WebSocket 和账号请求调整

- 风险：匿名 uid 在部分房间或账号状态下不可用。
- 控制：登录/未登录、多房间验证；保留可配置回退路径。
- 回滚：恢复按需 mid 请求，不恢复敏感日志。

### MAIN world Hook

- 风险：Hook 顺序变化可能导致 IP 属地功能失效或与页面脚本冲突。
- 控制：幂等标记、最小匹配范围、路由测试、上游版本追踪。
- 回滚：可以独立关闭 IP 属地脚本，不影响全屏 SC 主功能。

### 依赖升级

- 风险：多个 0.x 或大版本依赖同时升级时难以定位回归。
- 控制：按依赖域拆 PR，保留 lockfile 和构建产物对比。
- 回滚：按单一升级提交回退，不回退无关功能优化。

## 16. 完成定义

本计划视为完成需同时满足：

- 所有 P0 任务完成并有自动化回归测试。
- 计划纳入本轮发布的 P1 任务全部完成，未完成项有明确延期原因。
- 普通直播页不再永久 rAF 查找 video。
- 全屏内容主体按需加载或已有等效的显著常驻性能改善。
- 退出全屏、播放器替换和 iframe 重建均能正确清理资源。
- 敏感 token、WBI 签名和 mid 不出现在生产日志。
- 扩展权限与实际用途一致。
- 核心测试覆盖率和 E2E 已进入 CI 门禁。
- 版本、tag、GitHub Release、附件和商店提交状态可追溯。
- README、隐私说明和技术文档与实际实现一致。

## 17. 执行清单

- [x] OPT-001 整理测试分层和公共 fixture
- [x] OPT-002 补全屏生命周期回归测试
- [x] OPT-003 修复并启用扩展 E2E
- [x] OPT-101 建立统一显示状态机
- [x] OPT-102 重构播放器发现和观察器生命周期
- [x] OPT-103 让 mount/unmount 具备事务性
- [x] OPT-201 拆分轻量入口和功能主体
- [x] OPT-202 用到期定时器替代永久 useRAF
- [x] OPT-203 增加包体预算
- [x] OPT-301 加入请求取消和会话边界
- [x] OPT-302 并行化初始化并缓存 WBI key
- [x] OPT-303 验证并减少账号信息请求
- [x] OPT-304 完善 API 运行时校验和错误策略
- [x] OPT-401 SC 去重和删除记录治理
- [x] OPT-402 集中管理设置并支持多标签同步
- [x] OPT-403 修复拖动边界并使用 Pointer Events
- [x] OPT-404 完善无障碍和动效偏好
- [x] OPT-501 收窄 Manifest 权限和匹配范围
- [x] OPT-502 治理第三方 IP 属地脚本
- [x] OPT-503 隔离 SC 样式
- [x] OPT-504 清理生产日志和隐私暴露
- [x] OPT-601 逐步加强 TypeScript
- [x] OPT-602 清理未使用依赖
- [x] OPT-603 分阶段升级核心依赖
- [x] OPT-604 加强 CI 和提交门禁
- [x] OPT-701 修复版本、tag 和 Release 一致性
- [x] OPT-702 补全文档和产品状态说明
- [ ] OPT-703 最终回归和发布候选验收（自动化已通过，真实直播/商店状态需维护者人工验收）

## 18. 执行结果（2026-07-28）

- 自动化：TypeScript、ESLint、19 项单元测试、覆盖率门禁、2 项 Chrome 扩展 E2E、生产构建、包体预算、第三方脚本哈希和 release zip 校验均已通过。
- 覆盖率：statements 90.66%、branches 76.54%、functions 89.28%、lines 90.66%。
- 包体：常驻内容脚本 gzip 约 2.54 KiB；懒加载全屏 runtime gzip 约 157.42 KiB；Popup gzip 约 58.96 KiB；扩展总 gzip 约 234.66 KiB。
- 发布：远端和本地 `0.10.0` tag 已确认一致；发布与商店提交已拆为可独立重试阶段，并增加版本及单一附件校验。
- 第三方脚本约束：`public/bilibili-web-show-ip-location.user.js` 必须保持上游 release 原样；OPT-502 仅执行来源、哈希、注入范围和更新流程治理，不再直接修改脚本内部实现。
- 依赖：升级到 React 18.3、TypeScript 5.9、Jest 30、Puppeteer 24、ESLint 9 等 Node 20 兼容版本。WXT 0.21 因要求 Node 22、React 19 因属于独立破坏性迁移，按计划保留到单独升级批次。
- 人工待验：登录/未登录真实直播、同源 iframe、清晰度切换、SPA 切房、多标签、网络断开与 WebSocket 重连，以及 GitHub Release 附件和 Chrome Web Store 后台状态。详见 `docs/release-checklist.md`。
