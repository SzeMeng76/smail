# SMONE - 临时邮箱服务

一个基于 React Router v7 和 Cloudflare Workers 构建的现代化临时邮箱服务。

## 🌟 功能特性

- 🚀 **快速生成**: 一键生成临时邮箱地址
- ✨ **自定义前缀**: 支持使用自定义前缀创建个性化邮箱地址
- 🎲 **多域名支持**: 随机域名选择器，支持多个域名配置
- 🔄 **实时预览**: 输入时实时预览将要生成的邮箱地址
- 📧 **实时接收**: 即时接收和查看邮件，自动刷新收件箱
- 🔒 **隐私保护**: 邮箱到期后自动删除数据
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡️ **无服务器架构**: 基于 Cloudflare Workers，全球加速
- 🗄️ **现代化技术栈**: React Router v7、TypeScript、TailwindCSS
- 📊 **数据存储**: 使用 Cloudflare D1 数据库和 R2 对象存储

## 🛠️ 技术栈

- **前端**: React Router v7, TypeScript, TailwindCSS
- **后端**: Cloudflare Workers, Email Workers
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2 (附件存储)
- **ORM**: Drizzle ORM
- **邮件解析**: postal-mime

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

#### 方式1：本地开发环境（推荐用于开发）

复制环境变量示例文件并配置：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 文件，设置必要的环境变量：

```bash
# Session 密钥 - 用于用户会话加密
SESSION_SECRET=your-generated-secret-key

# 生成新的 Session 密钥命令：
openssl rand -base64 32
```

#### 方式2：生产环境配置（推荐用于部署）

**为避免每次部署时环境变量被清空，建议在 `wrangler.jsonc` 中配置：**

```jsonc
{
  // ... 其他配置
  "vars": {
    "ENVIRONMENT": "production",
    "SESSION_SECRET": "your-generated-secret-key",
    "AVAILABLE_DOMAINS": "smone.us,your-domain.com"
  }
}
```

**支持的环境变量：**
- `SESSION_SECRET`: 用户会话加密密钥（必需）
- `AVAILABLE_DOMAINS`: 可用域名列表，逗号分隔（可选，默认：smone.us）
  - 单个域名：`"smone.us"`
  - 多个域名：`"smone.us,temp.email,example.org"`
  - 多域名时支持随机选择和手动切换
- `ENVIRONMENT`: 运行环境标识（可选）

### 设置数据库

```bash
# 生成数据库迁移文件
pnpm run db:generate

# 应用迁移到本地数据库
pnpm run db:migrate
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:5173 可用。

## 🎯 高级功能

### 自定义邮箱前缀生成
- 支持用户自定义邮箱前缀（如：work@domain.com）
- 实时预览功能，输入时动态显示将要生成的邮箱地址
- 自动过滤无效字符，确保邮箱地址格式正确
- 空白前缀时自动切换为随机生成模式

### 多域名随机选择
- 支持配置多个可用域名
- 🎲 骰子按钮：一键随机选择域名
- 环境变量 `AVAILABLE_DOMAINS` 配置域名列表
- 自动负载均衡分配邮箱地址

### 智能用户体验
- 动态按钮文本：根据输入状态显示不同操作提示
- 高级选项折叠面板：保持界面简洁的同时提供强大功能
- 实时表单验证和用户反馈

## 📖 使用示例

### 快速生成邮箱
1. 访问主页，系统自动生成随机邮箱（如：`happy-bird-1234@smone.us`）
2. 点击复制按钮即可使用

### 自定义邮箱前缀
1. 点击 "高级选项" 展开配置面板
2. 输入自定义前缀（如：`work`）
3. 实时预览显示：`work@smone.us`
4. 点击 "✨ 使用 'work' 生成邮箱" 按钮

### 多域名选择
1. 在高级选项中选择不同域名
2. 点击 🎲 骰子按钮随机选择域名
3. 配合自定义前缀使用（如：`project@temp.email`）

## 🧪 本地开发和测试

### 发送测试邮件

```bash
# 快速发送测试邮件
pnpm run test:email

# 发送自定义测试邮件（带附件）
pnpm run test:email:custom [收件人] [发件人] [端口] [是否包含附件]

# 例如：
pnpm run test:email:custom mytest@smone.us sender@example.com 5173 true
```

### 数据库管理

```bash
# 查看迁移状态
pnpm run db:list

# 重置数据库（清空所有数据）
pnpm run db:reset

# 重新应用迁移
pnpm run db:migrate
```

详细的本地开发指南请查看：[docs/local-development.md](docs/local-development.md)

## 📦 生产环境构建

创建生产构建：

```bash
pnpm run build
```

## 🚀 部署

### 直接部署到生产环境

```bash
pnpm run deploy
```

### 部署预览版本

```bash
pnpm wrangler versions upload
```

验证后可以将版本提升到生产环境：

```bash
pnpm wrangler versions deploy
```

### 部署前准备

1. **配置 Cloudflare 服务**:
   - 创建 D1 数据库：`wrangler d1 create smail-database`
   - 创建 KV 命名空间：`wrangler kv namespace create "smail-kv"`
   - 创建 R2 存储桶：`wrangler r2 bucket create smail-attachments`
   
   **配置 Email Routing（重要！）**:
   
   a. 在 Cloudflare Dashboard 中配置：
      - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
      - 选择你的域名
      - 进入 **Email** → **Email Routing**
      - 点击 **Enable Email Routing**（如果还未启用）
      - Cloudflare 会自动添加必要的 MX 记录到你的 DNS
   
   b. 配置 Catch-all 规则：
      - 在 Email Routing 页面，找到 **Routing rules** 部分
      - 点击 **Catch-all address** 标签
      - 选择 **Action**: `Send to a Worker`
      - 选择你的 Worker: `smail`（或你在 wrangler.jsonc 中配置的 name）
      - 点击 **Save**
   
   c. 验证配置：
      - 确保 DNS 中的 MX 记录已生效（可能需要几分钟）
      - 检查 Email Routing 状态显示为 **Enabled**
      - Catch-all 规则应该显示为 **Active**

2. **配置 wrangler.jsonc**:
   确保 `wrangler.jsonc` 包含所有必要配置：
   ```jsonc
   {
     "name": "your-app-name",
     "vars": {
       "SESSION_SECRET": "your-session-secret",
       "AVAILABLE_DOMAINS": "smone.us,temp.example.com,mail.yourdomain.org"  // ⚠️ 必须配置你的域名
     },
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "smail-database",
         "database_id": "your-database-id"
       }
     ]
     // ... 其他配置
   }
   ```
   
   **⚠️ 重要提示**：
   - `AVAILABLE_DOMAINS` 必须配置为你在 Cloudflare 中设置 Email Routing 的域名
   - 如果不配置此变量，将无法接收邮件
   - 支持多个域名，用逗号分隔

3. **运行远程迁移**:
   ```bash
   pnpm run db:migrate:remote
   ```

### 📋 环境变量管理

**❗ 重要提示：为避免变量在部署时被清空**

- ✅ **推荐**：在 `wrangler.jsonc` 的 `vars` 字段中配置
- ❌ **不推荐**：仅在 Cloudflare Dashboard 中配置（可能被清空）
- 📝 **开发时**：使用 `.dev.vars` 文件

**添加新变量的步骤：**
1. 在 `wrangler.jsonc` 的 `vars` 中添加
2. 重新部署：`pnpm run deploy`
3. 变量会持久保存，不会被清空

## 📂 项目结构

```
├── app/                    # 应用代码
│   ├── components/         # React 组件
│   ├── db/                 # 数据库相关
│   │   ├── migrations/     # 数据库迁移文件
│   │   └── schema.ts       # 数据库模式定义
│   ├── lib/                # 工具函数和数据库操作
│   └── routes/             # 路由组件
├── workers/                # Cloudflare Workers
│   └── app.ts              # Email Worker
├── scripts/                # 开发脚本
│   ├── test-email.js       # 邮件测试脚本
│   └── test-email.sh       # Shell 测试脚本
├── docs/                   # 文档
└── wrangler.jsonc          # Cloudflare 配置
```

## 🎨 样式

项目使用 [Tailwind CSS](https://tailwindcss.com/) 进行样式设计，支持：
- 响应式设计
- 暗色模式
- 现代化 UI 组件
- 自定义设计系统

## 🔧 故障排查

### 收不到邮件？

如果部署后无法接收邮件，请按以下步骤检查：

1. **检查 AVAILABLE_DOMAINS 配置**
   - 确认 `wrangler.jsonc` 中的 `vars.AVAILABLE_DOMAINS` 已配置
   - 域名必须与 Cloudflare Email Routing 中配置的域名一致
   - 重新部署：`pnpm run deploy`

2. **检查 Cloudflare Email Routing**
   - 登录 Cloudflare Dashboard
   - 进入你的域名 → Email → Email Routing
   - 确认 Email Routing 状态为 **Enabled**
   - 确认 Catch-all 规则已配置为 `Send to a Worker: smail`
   - 检查 MX 记录是否已生效（DNS 传播可能需要几分钟到几小时）

3. **检查 Worker 日志**
   - 在 Cloudflare Dashboard 中查看 Worker 日志
   - 发送测试邮件后，查看是否有错误信息
   - 使用 `wrangler tail` 实时查看日志：
     ```bash
     pnpm wrangler tail
     ```

4. **测试邮件接收**
   - 使用外部邮箱（如 Gmail）发送测试邮件到 `test@你的域名.com`
   - 检查 Worker 日志中是否有收到邮件的记录
   - 在应用中查看是否显示邮件

5. **常见问题**
   - **MX 记录未生效**：等待 DNS 传播完成（使用 `dig MX 你的域名.com` 检查）
   - **Worker 名称不匹配**：确保 Email Routing 中选择的 Worker 名称与 `wrangler.jsonc` 中的 `name` 一致
   - **域名未配置**：必须在 `AVAILABLE_DOMAINS` 中添加域名
   - **数据库未迁移**：运行 `pnpm run db:migrate:remote`

## 🤝 贡献

欢迎贡献代码！请：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🛟 支持

如有问题，请：
- 查看 [本地开发指南](docs/local-development.md)
- 提交 GitHub Issue
- 查看 Cloudflare Workers 文档

---

使用 ❤️ 和 React Router 构建。
