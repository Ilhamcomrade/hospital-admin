package controllers

import (
	"log"
	"nama-module/config"
	"nama-module/models"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetDoctors mengambil semua data dokter
func GetDoctors(c *gin.Context) {
	rows, err := config.DB.Query("SELECT id, name, specialization, contact, photo FROM doctors ORDER BY id DESC")
	if err != nil {
		log.Println("Error fetching doctors:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching doctors"})
		return
	}
	defer rows.Close()

	var doctors []models.Doctor

	for rows.Next() {
		var d models.Doctor
		err := rows.Scan(&d.ID, &d.Name, &d.Specialization, &d.Contact, &d.Photo)
		if err != nil {
			log.Println("Error scanning doctor row:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning doctor row"})
			return
		}
		doctors = append(doctors, d)
	}

	c.JSON(http.StatusOK, doctors)
}

// GetDoctorById mengambil satu data dokter berdasarkan ID
func GetDoctorById(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	var d models.Doctor
	err = config.DB.QueryRow("SELECT id, name, specialization, contact, photo FROM doctors WHERE id = $1", id).
		Scan(&d.ID, &d.Name, &d.Specialization, &d.Contact, &d.Photo)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
		} else {
			log.Println("Failed to fetch doctor data:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doctor data"})
		}
		return
	}

	c.JSON(http.StatusOK, d)
}

// CreateDoctor menambahkan data dokter baru dengan upload file
func CreateDoctor(c *gin.Context) {
	// Bind form data. Gin secara otomatis menangani `multipart/form-data`
	var form struct {
		Name           string `form:"name" binding:"required"`
		Specialization string `form:"specialization"`
		Contact        string `form:"contact"`
	}

	if err := c.ShouldBind(&form); err != nil {
		log.Println("Validation error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Ambil file dari form
	file, err := c.FormFile("photo")
	var photoPath string

	if err == nil { // Jika file berhasil diunggah
		uploadsDir := "uploads"
		if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
			if err := os.Mkdir(uploadsDir, 0755); err != nil {
				log.Println("Failed to create uploads directory:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
				return
			}
		}

		photoPath = filepath.Join(uploadsDir, filepath.Base(file.Filename))
		if err := c.SaveUploadedFile(file, photoPath); err != nil {
			log.Println("Failed to save photo:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save photo"})
			return
		}
	} else if err != http.ErrMissingFile { // Tangani error lain selain file tidak ada
		log.Println("Error getting photo file:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get photo file"})
		return
	}

	// Masukkan data ke database dengan path foto
	query := `INSERT INTO doctors (name, specialization, contact, photo) VALUES ($1, $2, $3, $4)`
	_, err = config.DB.Exec(query, form.Name, form.Specialization, form.Contact, photoPath)
	if err != nil {
		log.Println("Failed to insert doctor:", err)
		if photoPath != "" {
			os.Remove(photoPath)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert doctor"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Doctor created", "photo_path": photoPath})
}

// UpdateDoctor memperbarui data dokter berdasarkan ID dengan upload file
func UpdateDoctor(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	name := c.PostForm("name")
	specialization := c.PostForm("specialization")
	contact := c.PostForm("contact")
	currentPhotoPath := c.PostForm("currentPhoto")

	var newPhotoPath string
	file, err := c.FormFile("photo")
	if err == nil {
		uploadsDir := "uploads"
		if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
			if err := os.Mkdir(uploadsDir, 0755); err != nil {
				log.Println("Failed to create uploads directory:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
				return
			}
		}

		if currentPhotoPath != "" {
			os.Remove(currentPhotoPath)
		}

		newPhotoPath = filepath.Join(uploadsDir, filepath.Base(file.Filename))
		if err := c.SaveUploadedFile(file, newPhotoPath); err != nil {
			log.Println("Failed to save new photo:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save photo"})
			return
		}
	} else if err != http.ErrMissingFile {
		log.Println("Error getting new photo file:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get photo file"})
		return
	} else {
		newPhotoPath = currentPhotoPath
	}

	query := `UPDATE doctors SET name=$1, specialization=$2, contact=$3, photo=$4 WHERE id=$5`
	res, err := config.DB.Exec(query, name, specialization, contact, newPhotoPath, id)
	if err != nil {
		log.Println("Failed to update doctor:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update doctor"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Doctor updated"})
}

// DeleteDoctor menghapus data dokter berdasarkan ID
func DeleteDoctor(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var photoPath string
	err = config.DB.QueryRow("SELECT photo FROM doctors WHERE id = $1", id).Scan(&photoPath)
	if err == nil && photoPath != "" {
		os.Remove(photoPath)
	}

	res, err := config.DB.Exec("DELETE FROM doctors WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete doctor"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Doctor deleted"})
}
