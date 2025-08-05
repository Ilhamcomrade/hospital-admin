package utils

import (
	"net/smtp"
)

func SendEmail(to string, subject string, body string) error {
	from := "ilhamwiguna2005@gmail.com"
	password := "kljn iuct cmbh ujct"

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	msg := "From: " + from + "\n" +
		"To: " + to + "\n" +
		"Subject: " + subject + "\n\n" +
		body

	auth := smtp.PlainAuth("", from, password, smtpHost)

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, []byte(msg))
	if err != nil {
		return err
	}
	return nil
}
