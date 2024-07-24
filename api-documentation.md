# Session Key Manager API 文档

## 基本信息

- 基础URL: `http://localhost:8080` (根据您的配置可能会有所不同)
- 所有POST和PUT请求应该有一个`Content-Type: application/json`的header
- 如果启用了认证（AUTH_ENABLED=true），所有请求都需要在header中包含一个有效的Bearer token：
  ```
  Authorization: Bearer your_auth_token_here
  ```

## 端点

### 1. 创建会话密钥

创建一个新的会话密钥。

- **URL**: `/api/v1/sessionkeys`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "key": "your_key",
    "code": "your_code",
    "status": true
  }
  ```
- **成功响应**:
  - **代码**: 201 Created
  - **内容**:
    ```json
    {
      "id": 1,
      "key": "base64_encoded_key",
      "code": "your_code",
      "status": true,
      "created_at": "2023-07-24T12:34:56Z",
      "updated_at": "2023-07-24T12:34:56Z"
    }
    ```
- **错误响应**:
  - **代码**: 400 Bad Request
  - **内容**:
    ```json
    {
      "error": "无效输入"
    }
    ```
  - **代码**: 500 Internal Server Error
  - **内容**:
    ```json
    {
      "error": "创建Session Key失败"
    }
    ```

### 2. 获取所有会话密钥

获取所有存储的会话密钥。

- **URL**: `/api/v1/sessionkeys`
- **方法**: `GET`
- **成功响应**:
  - **代码**: 200 OK
  - **内容**:
    ```json
    [
      {
        "id": 1,
        "key": "base64_encoded_key",
        "code": "code1",
        "status": true,
        "created_at": "2023-07-24T12:34:56Z",
        "updated_at": "2023-07-24T12:34:56Z"
      },
      {
        "id": 2,
        "key": "base64_encoded_key",
        "code": "code2",
        "status": false,
        "created_at": "2023-07-24T13:45:67Z",
        "updated_at": "2023-07-24T13:45:67Z"
      }
    ]
    ```
- **错误响应**:
  - **代码**: 500 Internal Server Error
  - **内容**:
    ```json
    {
      "error": "获取Session Keys失败"
    }
    ```

### 3. 获取单个会话密钥

通过ID获取特定的会话密钥。

- **URL**: `/api/v1/sessionkeys/:id`
- **方法**: `GET`
- **URL参数**: `id=[integer]`
- **成功响应**:
  - **代码**: 200 OK
  - **内容**:
    ```json
    {
      "id": 1,
      "key": "base64_encoded_key",
      "code": "your_code",
      "status": true,
      "created_at": "2023-07-24T12:34:56Z",
      "updated_at": "2023-07-24T12:34:56Z"
    }
    ```
- **错误响应**:
  - **代码**: 404 Not Found
  - **内容**:
    ```json
    {
      "error": "未找到Session Key"
    }
    ```
  - **代码**: 500 Internal Server Error
  - **内容**:
    ```json
    {
      "error": "获取Session Key失败"
    }
    ```

### 4. 更新会话密钥

更新特定的会话密钥。

- **URL**: `/api/v1/sessionkeys/:id`
- **方法**: `PUT`
- **URL参数**: `id=[integer]`
- **请求体**:
  ```json
  {
    "key": "updated_key",
    "code": "updated_code",
    "status": false
  }
  ```
  注意：您可以只更新您想要改变的字段。
- **成功响应**:
  - **代码**: 200 OK
  - **内容**:
    ```json
    {
      "id": 1,
      "key": "base64_encoded_updated_key",
      "code": "updated_code",
      "status": false,
      "created_at": "2023-07-24T12:34:56Z",
      "updated_at": "2023-07-24T14:56:78Z"
    }
    ```
- **错误响应**:
  - **代码**: 400 Bad Request
  - **内容**:
    ```json
    {
      "error": "无效输入"
    }
    ```
  - **代码**: 404 Not Found
  - **内容**:
    ```json
    {
      "error": "未找到Session Key"
    }
    ```
  - **代码**: 500 Internal Server Error
  - **内容**:
    ```json
    {
      "error": "更新Session Key失败"
    }
    ```

### 5. 删除会话密钥

删除特定的会话密钥。

- **URL**: `/api/v1/sessionkeys/:id`
- **方法**: `DELETE`
- **URL参数**: `id=[integer]`
- **成功响应**:
  - **代码**: 200 OK
  - **内容**:
    ```json
    {
      "message": "Session Key删除成功"
    }
    ```
- **错误响应**:
  - **代码**: 404 Not Found
  - **内容**:
    ```json
    {
      "error": "未找到Session Key"
    }
    ```
  - **代码**: 500 Internal Server Error
  - **内容**:
    ```json
    {
      "error": "删除Session Key失败"
    }
    ```

### 6. 获取OAuth令牌

获取用于身份验证的OAuth令牌。

- **URL**: `/api/v1/auth/oauth_token`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "session_key_id": 1,
    "base_url": "https://your-base-url.com",
    "unique_name": "optional_unique_identifier",
    "expires_in": 3600
  }
  ```
- **成功响应**:
  - **代码**: 200 OK
  - **内容**:
    ```json
    {
      "login_url": "https://your-base-url.com/login?token=your_oauth_token"
    }
    ```
- **错误响应**:
  - **代码**: 400 Bad Request
  - **内容**:
    ```json
    {
      "error": "无效输入"
    }
    ```
  - **代码**: 404 Not Found
  - **内容**:
    ```json
    {
      "error": "未找到Session Key"
    }
    ```
  - **代码**: 500 Internal Server Error
  - **内容**:
    ```json
    {
      "error": "无法连接到外部API"
    }
    ```

## 错误处理

所有的错误响应都会包含一个JSON对象，其中有一个`error`字段描述错误的性质。

## 数据模型

### SessionKey

- `id`: integer (自动生成)
- `key`: string (唯一)
- `code`: string (唯一)
- `status`: boolean
- `created_at`: datetime
- `updated_at`: datetime

注意：在API响应中，`key`字段会被base64编码以提高安全性。

## 安全注意事项

1. 确保在生产环境中使用HTTPS。
2. 妥善保管和定期更换授权令牌。
3. 考虑实施速率限制以防止滥用。
4. 定期审核和更新授权策略。

