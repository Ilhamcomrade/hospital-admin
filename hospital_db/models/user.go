package models

type User struct {
	ID          int    `json:"id"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	ResetToken  string `json:"reset_token"`
	TokenExpiry string `json:"token_expiry"`
}
