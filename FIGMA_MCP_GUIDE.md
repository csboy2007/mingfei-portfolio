# Claude Figma MCP 使用指南

本文档记录了如何使用 Claude Talk to Figma MCP 来通过 AI 直接操作 Figma 设计。

---

## 📋 目录
1. [如何运行 MCP Server](#如何运行-mcp-server)
2. [如何开始对话](#如何开始对话)
3. [配置说明](#配置说明)

---

## 🚀 如何运行 MCP Server

### 前置条件
确保以下内容已准备好：
- ✅ Figma Desktop 应用已安装
- ✅ Bun 已安装在 `~/.bun/bin/`
- ✅ Claude Talk to Figma MCP 已克隆到 `~/Desktop/claude-projects/claude-talk-to-figma-mcp`

### 步骤 1：启动 WebSocket 服务器

在终端中运行以下命令：

```bash
cd ~/Desktop/claude-projects/claude-talk-to-figma-mcp
bun socket
```

**成功标志：**
- 看到消息：`[INFO] Claude to Figma WebSocket server running on port 3055`
- 状态检查：访问 http://localhost:3055/status

**注意：** 保持这个终端窗口运行，不要关闭！

### 步骤 2：在 Figma 中运行插件

1. 打开 **Figma Desktop** 应用
2. 点击顶部菜单：**Plugins** → **Development** 
3. 点击 **Claude MCP Plugin**
4. 插件会显示：
   - WebSocket Server Port: `3055`
   - 点击 **Connect** 按钮
   - 连接成功后会显示 **Channel ID**（例如：`aztzivp8`）

**重要：** 记下这个 **Channel ID**，每次都不一样！

---

## 💬 如何开始对话

### 在 Claude Desktop 中使用

1. **打开 Claude Desktop 应用**

2. **切换到 Chat 标签页**（不是 Code 或 Cowork）

3. **连接到 Figma**：
   ```
   Talk to Figma, channel [你的Channel ID]
   ```
   例如：
   ```
   Talk to Figma, channel aztzivp8
   ```

4. **等待连接确认**
   - Claude 会回复确认已连接到 Figma

5. **开始设计**！例如：
   ```
   帮我在当前选中的 frame 中设计一个手机版车险登录界面，包括：
   - 顶部 Logo
   - 邮箱输入框
   - 密码输入框
   - 登录按钮
   - 忘记密码链接
   - 注册账号链接
   ```

### 使用技巧

✅ **好的提示词示例：**
- "创建一个带有侧边导航栏、顶部用户资料和基于卡片的指标的主要内容区域的仪表板"
- "重新设计这个按钮组件，添加悬停状态和更好的对比度"

❌ **避免模糊的提示词：**
- "让它看起来好看一点"（太模糊）

---

## ⚙️ 配置说明

### Cursor 配置（已完成）

配置文件位置：
```
~/Library/Application Support/Cursor/User/settings.json
```

配置内容：
```json
{
    "mcpServers": {
        "ClaudeTalkToFigma": {
            "command": "/Users/mingfeibi/.bun/bin/bun",
            "args": [
                "run",
                "/Users/mingfeibi/Desktop/claude-projects/claude-talk-to-figma-mcp/dist/talk_to_figma_mcp/server.js"
            ]
        }
    }
}
```

**注意：** Cursor 对此 MCP 的支持目前还不完善，建议使用 Claude Desktop。

### Claude Desktop 配置（已完成）

配置文件位置：
```
~/.claude.json
```

通过以下命令自动配置的：
```bash
claude mcp add -s user ClaudeTalkToFigma -- bunx claude-talk-to-figma-mcp@latest
```

### Figma 插件配置（已完成）

插件 manifest 位置：
```
~/Desktop/claude-projects/claude-talk-to-figma-mcp/src/claude_mcp_plugin/manifest.json
```

已通过 Figma → Plugins → Development → Import plugin from manifest 导入。

---

## 🔧 故障排除

### 问题：服务器启动失败，提示端口被占用

**原因：** 服务器已在运行

**解决方案：**
```bash
# 查看端口 3055 的使用情况
lsof -i :3055

# 如果需要停止旧进程
kill [PID]

# 然后重新启动
bun socket
```

### 问题：Figma 插件无法连接

**检查清单：**
1. ✅ WebSocket 服务器是否在运行？
2. ✅ 端口 3055 是否可访问？（访问 http://localhost:3055/status）
3. ✅ Figma Desktop 应用是否已打开？（不是浏览器版本）

### 问题：Claude Desktop 显示 MCP 断开连接

**解决方案：**
1. 确保 WebSocket 服务器正在运行
2. 在 Claude Desktop 中输入 `/mcp` 重新连接
3. 或重新输入 `Talk to Figma, channel [Channel ID]`

---

## 📊 系统架构

```
Claude Desktop ↔ MCP Server ↔ WebSocket Server ↔ Figma Plugin
                                 (port 3055)
```

**工作流程：**
1. Claude Desktop 通过 MCP Server (stdio) 发送设计命令
2. MCP Server 通过 WebSocket 转发到服务器 (port 3055)
3. WebSocket 服务器将消息发送到 Figma Plugin (通过 channel)
4. Figma Plugin 在 Figma 中执行设计操作
5. 结果通过相同路径返回

---

## 📝 重要提醒

1. **保持服务器运行：** 使用期间不要关闭运行 `bun socket` 的终端
2. **记录 Channel ID：** 每次插件连接后的 Channel ID 都不同
3. **使用 Figma Desktop：** 浏览器版本不支持插件
4. **Pro 计划已足够：** Claude Pro 计划已包含 MCP 集成功能
5. **使用量限制：** Claude Pro 有每日使用量限制，达到后需等待重置或按消息付费

---

## 🎯 快速开始检查清单

开始使用前，确保：

- [ ] 终端运行了 `bun socket`，看到服务器启动消息
- [ ] Figma Desktop 中插件显示 "Connected" 状态
- [ ] 记录了当前的 Channel ID
- [ ] Claude Desktop 已打开，在 Chat 标签页
- [ ] 在 Figma 中选中了要操作的 frame

全部完成后，在 Claude Desktop 中输入：
```
Talk to Figma, channel [你的Channel ID]
```

开始设计！🎨

---

## 🛠️ 配置过程记录

以下是本次配置过程中完成的所有步骤。

### 1. 安装 Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

**结果：** Bun 安装在 `~/.bun/bin/bun`

### 2. 克隆并构建 MCP Server

```bash
cd ~/Desktop/claude-projects
git clone https://github.com/arinspunk/claude-talk-to-figma-mcp.git
cd claude-talk-to-figma-mcp
bun install
bun run build
```

**结果：** 
- 项目克隆到 `~/Desktop/claude-projects/claude-talk-to-figma-mcp`
- 依赖安装完成
- 构建输出到 `dist/` 目录

### 3. 配置 Cursor 的 MCP Server

**文件：** `~/Library/Application Support/Cursor/User/settings.json`

**添加内容：**
```json
"mcpServers": {
    "ClaudeTalkToFigma": {
        "command": "/Users/mingfeibi/.bun/bin/bun",
        "args": [
            "run",
            "/Users/mingfeibi/Desktop/claude-projects/claude-talk-to-figma-mcp/dist/talk_to_figma_mcp/server.js"
        ]
    }
}
```

**注意事项：**
- 使用了 bun 的完整路径，因为 Cursor 的环境变量可能不包含 `~/.bun/bin/`
- 指向本地构建的 server.js 文件，而不是 `bunx` 的 @latest 版本
- 需要重启 Cursor 才能加载配置

**当前状态：** Cursor 对此类型的 MCP 支持有限，连接不稳定

### 4. 配置 Claude Desktop 的 MCP Server

通过 Claude CLI 配置：
```bash
claude mcp add -s user ClaudeTalkToFigma -- bunx claude-talk-to-figma-mcp@latest
```

**结果：** 配置添加到 `~/.claude.json`

**当前状态：** 已配置成功，可以使用（需要 Claude Pro 计划）

### 5. 在 Figma 中安装插件

**步骤：**
1. 打开 Figma Desktop
2. 菜单：Plugins → Development → Import plugin from manifest...
3. 选择文件：`~/Desktop/claude-projects/claude-talk-to-figma-mcp/src/claude_mcp_plugin/manifest.json`
4. 插件成功导入

**常见错误：**
- ❌ 选择了项目根目录的 `manifest.json`（这是 DXT 包的 manifest）
- ✅ 应该选择 `src/claude_mcp_plugin/manifest.json`（这才是 Figma 插件的 manifest）

**当前状态：** 插件已成功安装，可以运行并连接

### 6. 启动 WebSocket 服务器

**命令：**
```bash
cd ~/Desktop/claude-projects/claude-talk-to-figma-mcp
bun socket
```

**等价命令：**
```bash
/Users/mingfeibi/.bun/bin/bun run dist/socket.js
```

**服务器信息：**
- 监听端口：3055
- 状态端点：http://localhost:3055/status
- 每 10 秒输出一次服务器统计信息

**当前状态：** 服务器运行中（PID: 79144）

### 7. 测试连接

**观察到的行为：**
1. Figma 插件成功连接到 WebSocket 服务器
2. 生成了 Channel ID：`aztzivp8`
3. Cursor 尝试连接但连接不稳定（连接后立即断开，错误码 1001）
4. Claude Desktop 可以连接（受使用量限制）

**服务器日志显示：**
```
[INFO] New client connected: client_1770259161697_pfap68p
[DEBUG] Received message from client: {"type":"join","channel":"aztzivp8"}
[INFO] Creating new channel: aztzivp8
[INFO] Client joined channel: aztzivp8
[INFO] WebSocket closed for client: Code 1001
```

### 技术细节

**MCP Server 架构：**
- **协议：** Model Context Protocol (MCP)
- **通信方式：** stdio（标准输入输出）
- **WebSocket 桥接：** MCP Server 通过 WebSocket 与 Figma Plugin 通信
- **Channel 机制：** 通过 Channel ID 隔离不同会话

**支持的工具：**
- Document Tools：文档分析、获取选择、节点信息等
- Creation Tools：创建形状、文本、框架等
- Modification Tools：修改颜色、大小、位置等
- Text Tools：字体加载、文本扫描等
- Component Tools：组件管理

**文件结构：**
```
claude-talk-to-figma-mcp/
├── src/
│   ├── claude_mcp_plugin/      # Figma 插件代码
│   │   ├── manifest.json       # 插件配置文件
│   │   ├── code.js            # 插件主逻辑
│   │   └── ui.html            # 插件 UI
│   ├── socket.ts              # WebSocket 服务器
│   └── talk_to_figma_mcp/     # MCP Server 实现
│       ├── server.ts          # MCP Server 主文件
│       └── tools/             # 各种 Figma 操作工具
└── dist/                      # 构建输出
    ├── socket.js              # WebSocket 服务器（构建后）
    └── talk_to_figma_mcp/
        └── server.js          # MCP Server（构建后）
```

### 已知限制

1. **Cursor MCP 支持：** Cursor 对 WebSocket 类型的 MCP 支持还不完善
2. **Claude Desktop 使用量：** Pro 计划有每日消息限制
3. **Figma Desktop Only：** 必须使用桌面版，浏览器版不支持插件
4. **Channel ID 变化：** 每次插件重新连接会生成新的 Channel ID

### 下一步优化建议

1. **等待 Cursor 改进 MCP 支持**
2. **考虑升级到 Claude Max** 如果需要更高使用量
3. **创建自动化脚本** 启动所有必要服务
4. **添加错误处理** 处理连接中断等情况

---

**文档更新时间：** 2026-02-04  
**MCP Server 版本：** claude-talk-to-figma-mcp@latest  
**项目地址：** https://github.com/arinspunk/claude-talk-to-figma-mcp  
**配置完成时间：** 2026-02-04 21:30 - 22:00
