package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SessionKey 结构体定义了数据库中存储的会话密钥的结构
type SessionKey struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Key       string    `json:"key" gorm:"uniqueIndex" binding:"required"`
	Code      string    `json:"code" gorm:"uniqueIndex" binding:"required"`
	Status    bool      `json:"status" binding:"required"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

var (
	db          *gorm.DB
	ErrNoRows   = errors.New("no rows in result set")
	authEnabled bool
	authToken   string
)

// init 函数在 main 函数之前运行，用于加载环境变量
func init() {
	// 尝试加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("未找到 .env 文件")
	}
	// 从环境变量中读取认证设置
	authEnabled = getEnv("AUTH_ENABLED", "false") == "true"
	authToken = getEnv("AUTH_TOKEN", "")
}

func main() {
	// 获取数据库路径，如果环境变量中未设置，则使用默认值
	dbPath := getEnv("DB_PATH", "sessionkeys.db")

	// 检查数据库文件是否存在，如不存在则创建目录
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		dir := filepath.Dir(dbPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Fatalf("创建数据库目录失败: %v", err)
		}
		log.Printf("数据库文件 %s 不存在，将创建新的数据库", dbPath)
	} else {
		log.Printf("使用现有的数据库文件: %s", dbPath)
	}

	var err error
	// 连接到 SQLite 数据库
	db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}

	// 检查是否需要自动迁移
	if getEnv("AUTO_MIGRATE", "false") == "true" {
		if err := db.AutoMigrate(&SessionKey{}); err != nil {
			log.Fatalf("数据库迁移失败: %v", err)
		}
		log.Println("数据库自动迁移完成")
	}

	// 设置路由
	r := setupRouter()
	// 获取端口号，如果环境变量中未设置，则使用默认值 8080
	port := getEnv("PORT", "8080")
	log.Printf("服务器正在运行，http://127.0.0.1:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}

// setupRouter 函数设置 Gin 路由器和中间件
func setupRouter() *gin.Engine {
	// 在生产环境中设置为 release 模式
	if os.Getenv("GIN_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// 设置 CORS 中间件
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 设置静态文件服务
	r.StaticFile("/app.js", "./web/app.js")
	r.StaticFile("/styles.css", "./web/styles.css")
	r.StaticFile("/logo.png", "./web/logo.png")

	// 处理根路由
	r.GET("/", serveIndexHTML)

	// 如果启用了认证，添加认证中间件
	if authEnabled {
		r.Use(authMiddleware)
	}

	// 设置 API 路由
	v1 := r.Group("/api/v1")
	{
		v1.POST("/sessionkeys", createSessionKey)
		v1.GET("/sessionkeys", getAllSessionKeys)
		v1.GET("/sessionkeys/:id", getSessionKey)
		v1.PUT("/sessionkeys/:id", updateSessionKey)
		v1.DELETE("/sessionkeys/:id", deleteSessionKey)
		v1.POST("/auth/oauth_token", getOAuthToken)
	}

	return r
}

// serveIndexHTML 处理对 index.html 的请求
func serveIndexHTML(c *gin.Context) {
	c.File("./web/index.html")
}

// createSessionKey 函数处理创建新会话密钥的请求
func createSessionKey(c *gin.Context) {
	var newKey SessionKey
	if err := c.ShouldBindJSON(&newKey); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效输入"})
		return
	}

	// 检查 Key 是否已存在
	var existingKey SessionKey
	if err := db.Where("key = ?", newKey.Key).First(&existingKey).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key已存在"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查Key失败"})
		return
	}

	// 检查 Code 是否已存在
	if err := db.Where("code = ?", newKey.Code).First(&existingKey).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code已存在"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查Code失败"})
		return
	}

	if err := db.Create(&newKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建Session Key失败"})
		return
	}

	// 混淆 Key 后返回
	newKey.Key = obfuscate(newKey.Key)
	c.JSON(http.StatusCreated, newKey)
}

// getAllSessionKeys 函数处理获取所有会话密钥的请求
func getAllSessionKeys(c *gin.Context) {
	var sessionKeys []SessionKey
	if err := db.Find(&sessionKeys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Session Keys失败"})
		return
	}
	// 混淆所有 Key
	for i := range sessionKeys {
		sessionKeys[i].Key = obfuscate(sessionKeys[i].Key)
	}
	c.JSON(http.StatusOK, sessionKeys)
}

// getSessionKey 函数处理获取单个会话密钥的请求
func getSessionKey(c *gin.Context) {
	id := c.Param("id")
	var sk SessionKey
	if err := db.First(&sk, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "未找到Session Key"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Session Key失败"})
		}
		return
	}
	// 混淆 Key
	sk.Key = obfuscate(sk.Key)
	c.JSON(http.StatusOK, sk)
}

// updateSessionKey 函数处理更新会话密钥的请求
func updateSessionKey(c *gin.Context) {
	id := c.Param("id")
	var sk SessionKey
	if err := db.First(&sk, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "未找到Session Key"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Session Key失败"})
		}
		return
	}

	var input struct {
		Key    string `json:"key"`
		Code   string `json:"code"`
		Status *bool  `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效输入"})
		return
	}

	if input.Key != "" && input.Key != sk.Key {
		// 检查新的 Key 是否已存在
		var existingKey SessionKey
		if err := db.Where("key = ? AND id != ?", input.Key, sk.ID).First(&existingKey).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Key已存在"})
			return
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查Key失败"})
			return
		}
		sk.Key = input.Key
	}

	if input.Code != "" && input.Code != sk.Code {
		// 检查新的 Code 是否已存在
		var existingKey SessionKey
		if err := db.Where("code = ? AND id != ?", input.Code, sk.ID).First(&existingKey).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Code已存在"})
			return
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查Code失败"})
			return
		}
		sk.Code = input.Code
	}

	if input.Status != nil {
		sk.Status = *input.Status
	}

	if err := db.Save(&sk).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新Session Key失败"})
		return
	}

	c.JSON(http.StatusOK, sk)
}

// deleteSessionKey 函数处理删除会话密钥的请求
func deleteSessionKey(c *gin.Context) {
	id := c.Param("id")
	result := db.Delete(&SessionKey{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除Session Key失败"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到Session Key"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Session Key删除成功"})
}

// OAuthRequest 结构体定义了OAuth请求的结构
type OAuthRequest struct {
	SessionKeyID uint   `json:"session_key_id" binding:"required"`
	BaseURL      string `json:"base_url" binding:"required"`
	UniqueName   string `json:"unique_name"`
}

// OAuthResponse 结构体定义了OAuth响应的结构
type OAuthResponse struct {
	LoginURL   string `json:"login_url"`
	OAuthToken string `json:"oauth_token"`
}

// getOAuthToken 函数处理获取OAuth令牌的请求
func getOAuthToken(c *gin.Context) {
	var request OAuthRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效输入"})
		return
	}

	// 从数据库中获取SessionKey
	var sessionKey SessionKey
	if err := db.First(&sessionKey, request.SessionKeyID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "未找到Session Key"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Session Key失败"})
		}
		return
	}

	// 准备请求体
	var requestBody string
	if request.UniqueName == "" {
		requestBody = fmt.Sprintf(`{"session_key": "%s"}`, sessionKey.Key)
	} else {
		requestBody = fmt.Sprintf(`{"session_key": "%s", "unique_name": "%s"}`, sessionKey.Key, request.UniqueName)
	}

	// 向外部API发送请求
	resp, err := http.Post(fmt.Sprintf("%s/manage-api/auth/oauth_token", request.BaseURL),
		"application/json",
		strings.NewReader(requestBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法连接到外部API"})
		return
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取响应体失败"})
		return
	}

	var oauthResp OAuthResponse
	if err := json.Unmarshal(body, &oauthResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "解析响应失败"})
		return
	}

	// 构造完整的登录URL
	fullLoginURL := request.BaseURL + oauthResp.LoginURL

	// 返回响应给客户端
	c.JSON(http.StatusOK, gin.H{"login_url": fullLoginURL})
}

// getEnv 函数用于获取环境变量，如果不存在则返回默认值
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// 混淆函数
func obfuscate(data string) string {
	return base64.StdEncoding.EncodeToString([]byte(data))
}

// 认证中间件
func authMiddleware(c *gin.Context) {
	if !authEnabled {
		c.Next()
		return
	}

	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		c.Abort()
		return
	}

	// 预期格式: "Bearer <token>"
	parts := strings.SplitN(authHeader, " ", 2)
	if !(len(parts) == 2 && parts[0] == "Bearer") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无效授权"})
		c.Abort()
		return
	}

	if parts[1] != authToken {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无效授权"})
		c.Abort()
		return
	}

	c.Next()
}
