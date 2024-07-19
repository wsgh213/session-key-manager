# Session Key Manager

## 项目概述

Session Key Manager 是一个用于管理会话密钥的web应用程序。它提供了一个简单的界面，允许用户创建、查看、更新和删除会话密钥。此应用程序使用Go语言的Gin框架作为后端，并使用vanilla JavaScript构建前端界面。此项目需要配合 [Fuclaude](https://github.com/wozulong/fuclaude) 使用。


## 主要功能

1. 创建新的会话密钥
2. 查看所有会话密钥列表
3. 更新会话密钥状态（激活/停用）
4. 删除会话密钥
5. 使用会话密钥进行身份验证跳转
6. 支持隔离挑战模式的跳转

## 技术栈

- 后端：Go (Gin框架)
- 数据库：SQLite
- 前端：HTML, CSS, JavaScript
- HTTP客户端：Axios

## 安装说明

1. 克隆仓库：
   ```
   git clone https://github.com/yourusername/session-key-manager.git
   cd session-key-manager
   ```

2. 安装Go依赖：
   ```
   go mod tidy
   ```

3. 编译程序：
   ```
   go build -o session-key-manager
   ```

## 配置

在项目根目录创建一个 `.env` 文件，包含以下配置：

```
GIN_ENV=dev
PORT=8080
DB_PATH=./database
AUTO_MIGRATE=true
AUTH_ENABLED=true
AUTH_TOKEN=your_auth_token_here
```

根据需要调整这些值。

## 运行应用

1. 启动后端服务：
   ```
   ./session-key-manager
   ```

2. 打开浏览器访问 `http://localhost:8080`

## 使用说明

1. 创建会话密钥：
   - 在表单中输入新的Key和Code
   - 点击"创建新的Key"按钮

2. 查看会话密钥：
   - 所有会话密钥都会显示在主页面的表格中

3. 更新会话密钥状态：
   - 点击每个会话密钥旁边的"激活"或"停用"按钮

4. 删除会话密钥：
   - 点击要删除的会话密钥旁边的"删除"按钮

5. 身份验证跳转：
   - 点击激活状态的会话密钥旁边的"跳转"按钮

6. 隔离挑战模式跳转：
   - 点击激活状态的会话密钥旁边的"隔离跳转"按钮
   - 在弹出的模态框中输入唯一标识符

## API 文档

### 创建会话密钥
- 方法：POST
- 路径：/api/v1/sessionkeys
- 请求体：
  ```json
  {
    "key": "your_key",
    "code": "your_code",
    "status": true
  }
  ```

### 获取所有会话密钥
- 方法：GET
- 路径：/api/v1/sessionkeys

### 获取单个会话密钥
- 方法：GET
- 路径：/api/v1/sessionkeys/:id

### 更新会话密钥
- 方法：PUT
- 路径：/api/v1/sessionkeys/:id
- 请求体：
  ```json
  {
    "status": false
  }
  ```

### 删除会话密钥
- 方法：DELETE
- 路径：/api/v1/sessionkeys/:id

### 获取OAuth令牌
- 方法：POST
- 路径：/api/v1/auth/oauth_token
- 请求体：
  ```json
  {
    "session_key_id": 1,
    "base_url": "https://your-base-url.com",
    "unique_name": "optional_unique_identifier"
  }
  ```

## 注意事项

- 确保在生产环境中更改默认的认证令牌。
- 定期备份数据库文件。
- 在生产环境中，建议使用更安全的数据库系统，如PostgreSQL或MySQL。

## 贡献

欢迎提交问题报告和合并请求。对于重大更改，请先打开一个问题来讨论您想要改变的内容。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)