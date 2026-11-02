# 开发文档

本文档记录仅用于开发和发布配置的操作说明，不属于用户文档。

## Chrome 商店 OAuth 配置

发布工作流使用 Chrome Web Store API V2，需要通过 OAuth 2.0 获取长期有效的 refresh token。

1. 在 Google Cloud Console 中启用 Chrome Web Store API，确认用于发布的 Google 账号拥有该扩展，且已开启两步验证。
2. 在“凭据”中创建 OAuth 客户端，应用类型选择 **Web 应用**，添加已授权重定向 URI：
   `https://developers.google.com/oauthplayground`
   已有可用的 Web 应用客户端（名称：获取refresh token）可以复用。
3. 打开 [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)，点击右上角齿轮，勾选 **Use your own OAuth credentials**，填入 Client ID 和 Client Secret。
4. 在 Step 1 输入 scope：
   `https://www.googleapis.com/auth/chromewebstore`
5. 使用拥有该扩展的账号完成授权，在 Step 2 点击 **Exchange authorization code for tokens**，复制返回的 `refresh_token`。
6. 同时更新 `CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`、`CHROME_REFRESH_TOKEN`。三个值必须来自同一个 OAuth 客户端，复制时不要带入空格或换行。

不要使用 OAuth Playground 的默认凭据，否则 refresh token 会在 24 小时后失效。
