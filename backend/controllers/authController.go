package controllers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"errors"
	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/Lihakk/poker-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const refreshCookie = "pokerlearn_refresh"

func cookieSecure(c *gin.Context) bool {
	return c.Request.TLS != nil || os.Getenv("COOKIE_SECURE") == "true"
}

func setRefreshCookie(c *gin.Context, value string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(refreshCookie, value, maxAge, "/api", "", cookieSecure(c), true)
}

func hashRefresh(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func newRefreshSession(tx *gorm.DB, userID uint) (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	value := hex.EncodeToString(bytes)
	err := tx.Create(&models.RefreshSession{UserID: userID, TokenHash: hashRefresh(value), ExpiresAt: time.Now().Add(7 * 24 * time.Hour)}).Error
	return value, err
}

func authResponse(c *gin.Context, user models.User, refresh string) {
	access, err := utils.GenerateToken(user.ID, user.Role, user.TokenVersion)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}
	setRefreshCookie(c, refresh, 7*24*3600)
	c.JSON(http.StatusOK, gin.H{"token": access, "user": gin.H{"id": user.ID, "username": user.Username, "email": user.Email, "role": user.Role}})
}

func Register(c *gin.Context) {
	var body struct {
		Username string `json:"username" binding:"required,min=2,max=80"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || !textWithin(strings.TrimSpace(body.Username), 2, 80) || !textWithin(body.Email, 1, 191) || len(body.Password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account details"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create account"})
		return
	}
	user := models.User{Username: strings.TrimSpace(body.Username), Email: strings.ToLower(strings.TrimSpace(body.Email)), PasswordHash: string(hash), Role: "learner"}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return tx.Create(&models.Profile{UserID: user.ID, Rank: 1}).Error
	})
	if err != nil {
		var conflict *mysql.MySQLError
		if errors.As(err, &conflict) && conflict.Number == 1062 {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create account"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": user.ID, "message": "Account created"})
}

func Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credentials"})
		return
	}
	var user models.User
	if database.DB.Where("email = ?", strings.ToLower(strings.TrimSpace(body.Email))).First(&user).Error != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}
	refresh, err := newRefreshSession(database.DB, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create session"})
		return
	}
	authResponse(c, user, refresh)
}

func Refresh(c *gin.Context) {
	value, err := c.Cookie(refreshCookie)
	if err != nil || value == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token required"})
		return
	}
	var user models.User
	var replacement string
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var session models.RefreshSession
		if err := tx.Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", hashRefresh(value), time.Now()).First(&session).Error; err != nil {
			return err
		}
		if tx.Model(&session).Where("revoked_at IS NULL").Update("revoked_at", time.Now()).RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		if err := tx.First(&user, session.UserID).Error; err != nil {
			return err
		}
		var createErr error
		replacement, createErr = newRefreshSession(tx, user.ID)
		return createErr
	})
	if err != nil {
		var reused models.RefreshSession
		if database.DB.Where("token_hash = ? AND revoked_at IS NOT NULL", hashRefresh(value)).First(&reused).Error == nil {
			database.DB.Transaction(func(tx *gorm.DB) error {
				if err := tx.Model(&models.RefreshSession{}).Where("user_id = ? AND revoked_at IS NULL", reused.UserID).Update("revoked_at", time.Now()).Error; err != nil {
					return err
				}
				return tx.Model(&models.User{}).Where("id = ?", reused.UserID).Update("token_version", gorm.Expr("token_version + 1")).Error
			})
		}
		setRefreshCookie(c, "", -1)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh session expired or revoked"})
		return
	}
	authResponse(c, user, replacement)
}

func Logout(c *gin.Context) {
	if value, err := c.Cookie(refreshCookie); err == nil {
		var session models.RefreshSession
		if database.DB.Where("token_hash = ? AND revoked_at IS NULL", hashRefresh(value)).First(&session).Error == nil {
			database.DB.Transaction(func(tx *gorm.DB) error {
				if err := tx.Model(&models.RefreshSession{}).Where("user_id = ? AND revoked_at IS NULL", session.UserID).Update("revoked_at", time.Now()).Error; err != nil {
					return err
				}
				return tx.Model(&models.User{}).Where("id = ?", session.UserID).Update("token_version", gorm.Expr("token_version + 1")).Error
			})
		}
	}
	setRefreshCookie(c, "", -1)
	c.Status(http.StatusNoContent)
}

func RequireAuth(c *gin.Context) {
	parts := strings.Fields(c.GetHeader("Authorization"))
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
		return
	}
	claims, err := utils.ParseToken(parts[1])
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired access token"})
		return
	}
	id, err := strconv.ParseUint(claims.Subject, 10, 64)
	if err != nil || id == 0 {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identity"})
		return
	}
	var user models.User
	if database.DB.Select("id", "role", "token_version").First(&user, id).Error != nil || user.Role != claims.Role || user.TokenVersion != claims.Version {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Account or role changed"})
		return
	}
	c.Set("userID", user.ID)
	c.Set("role", user.Role)
	c.Next()
}

func RequireEditor(c *gin.Context) {
	role := c.GetString("role")
	if role != "editor" && role != "admin" {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Editor role required"})
		return
	}
	c.Next()
}

func RequireAdmin(c *gin.Context) {
	if c.GetString("role") != "admin" {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Administrator role required"})
		return
	}
	c.Next()
}

func UpdateRole(c *gin.Context) {
	var body struct {
		Role string `json:"role" binding:"required,oneof=learner editor admin"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	var account models.User
	if err := database.DB.First(&account, id).Error; err != nil {
		dbError(c, err)
		return
	}
	result := database.DB.Model(&account).Update("role", body.Role)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update role"})
	} else {
		c.JSON(http.StatusOK, gin.H{"id": id, "role": body.Role})
	}
}
