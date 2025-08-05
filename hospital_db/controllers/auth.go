package controllers

import (
	"database/sql"
	"nama-module/config"
	"nama-module/utils"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var JWT_SECRET = []byte("your_jwt_secret_key")

// ========================
// Login
// ========================
func Login(c *gin.Context) {
	type LoginInput struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	var userID int
	var hashedPassword string
	err := config.DB.QueryRow("SELECT id, password FROM users WHERE email=$1", input.Email).Scan(&userID, &hashedPassword)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   input.Email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(JWT_SECRET)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil",
		"token":   tokenString,
	})
}

// ========================
// Forgot Password
// ========================
func ForgotPassword(c *gin.Context) {
	type ForgotPasswordInput struct {
		Email string `json:"email"`
	}

	var input ForgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	var userID int
	err := config.DB.QueryRow("SELECT id FROM users WHERE email=$1", input.Email).Scan(&userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	token := uuid.New().String()
	expiry := time.Now().Add(15 * time.Minute)

	_, err = config.DB.Exec("UPDATE users SET reset_token=$1, token_expiry=$2 WHERE email=$3", token, expiry, input.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan token"})
		return
	}

	resetURL := "http://localhost:5173/reset-password?token=" + token
	subject := "Reset Password"
	body := "Klik link berikut untuk reset password Anda:\n\n" + resetURL

	if err := utils.SendEmail(input.Email, subject, body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim email: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link reset telah dikirim ke email"})
}

// ========================
// Reset Password
// ========================
func ResetPassword(c *gin.Context) {
	type ResetPasswordInput struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}

	var input ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	// Pastikan token tidak kosong
	if input.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token wajib diisi"})
		return
	}

	// Coba ambil user berdasarkan token
	var userID int
	var tokenExpiry sql.NullTime
	var dbToken sql.NullString
	err := config.DB.QueryRow(`
		SELECT id, reset_token, token_expiry
		FROM users
		WHERE reset_token = $1
	`, input.Token).Scan(&userID, &dbToken, &tokenExpiry)

	if err != nil {
		// Jika tidak ditemukan, cek apakah token pernah digunakan (sudah NULL di DB)
		var tokenUsed bool
		checkErr := config.DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM users
				WHERE reset_token IS NULL AND token_expiry IS NULL AND $1 != ''
			)
		`, input.Token).Scan(&tokenUsed)

		if checkErr == nil && tokenUsed {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Token sudah digunakan"})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{"error": "Token tidak valid"})
		return
	}

	// Cek jika token kadaluarsa
	if tokenExpiry.Valid && time.Now().After(tokenExpiry.Time) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token kadaluarsa"})
		return
	}

	// Enkripsi password baru
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
		return
	}

	// Update password dan hapus token
	_, err = config.DB.Exec(`
		UPDATE users
		SET password = $1, reset_token = NULL, token_expiry = NULL
		WHERE id = $2
	`, hashedPassword, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengubah password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah. Token tidak bisa digunakan lagi."})
}
