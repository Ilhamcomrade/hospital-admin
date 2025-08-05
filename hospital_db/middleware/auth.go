package controllers

import (
	"nama-module/config"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

var JWT_SECRET = []byte("your_jwt_secret_key") // ganti jika perlu

func Login(c *gin.Context) {
	type LoginInput struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Hanya izinkan email ilhamwiguna2005@gmail.com
	if input.Email != "ilhamwiguna2005@gmail.com" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized user"})
		return
	}

	var id int
	var hashedPassword string
	err := config.DB.QueryRow("SELECT id, password FROM users WHERE email=$1", input.Email).Scan(&id, &hashedPassword)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password"})
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": id,
		"email":   input.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(JWT_SECRET)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Login successful", "token": tokenString})
}

func ForgotPassword(c *gin.Context) {
	type ForgotInput struct {
		Email string `json:"email"`
	}

	var input ForgotInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Simulasikan token reset
	token := "reset-token-123" // Harusnya acak & unik

	_, err := config.DB.Exec("UPDATE users SET reset_token=$1, token_expiry=$2 WHERE email=$3",
		token, time.Now().Add(15*time.Minute), input.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Email not found or DB error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reset token sent", "token": token})
}
