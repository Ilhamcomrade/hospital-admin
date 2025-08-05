package controllers

import (
	"net/http"
	"strconv"

	"nama-module/config"
	"nama-module/models"

	"github.com/gin-gonic/gin"
)

func GetPatients(c *gin.Context) {
	rows, err := config.DB.Query("SELECT id, name, birth_date, gender, address, contact, visit_date, complaint FROM patients ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching patients"})
		return
	}
	defer rows.Close()

	var patients []models.Patient

	for rows.Next() {
		var p models.Patient
		err := rows.Scan(&p.ID, &p.Name, &p.BirthDate, &p.Gender, &p.Address, &p.Contact, &p.VisitDate, &p.Complaint)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning patient row"}) // Added error handling for scan
			return
		}
		patients = append(patients, p)
	}

	c.JSON(http.StatusOK, patients)
}

// Tambahkan fungsi ini untuk mendapatkan satu pasien berdasarkan ID
func GetPatientById(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var p models.Patient
	// Gunakan QueryRow untuk mengambil satu baris
	err = config.DB.QueryRow("SELECT id, name, birth_date, gender, address, contact, visit_date, complaint FROM patients WHERE id = $1", id).
		Scan(&p.ID, &p.Name, &p.BirthDate, &p.Gender, &p.Address, &p.Contact, &p.VisitDate, &p.Complaint)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch patient data"})
		}
		return
	}

	c.JSON(http.StatusOK, p)
}

func CreatePatient(c *gin.Context) {
	var p models.Patient
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	query := `INSERT INTO patients (name, birth_date, gender, address, contact, visit_date, complaint)
			  VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := config.DB.Exec(query, p.Name, p.BirthDate, p.Gender, p.Address, p.Contact, p.VisitDate, p.Complaint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert patient"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Patient created"})
}

func UpdatePatient(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var p models.Patient
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	query := `UPDATE patients SET name=$1, birth_date=$2, gender=$3, address=$4, contact=$5, visit_date=$6, complaint=$7 WHERE id=$8`
	res, err := config.DB.Exec(query, p.Name, p.BirthDate, p.Gender, p.Address, p.Contact, p.VisitDate, p.Complaint, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient updated"})
}

func DeletePatient(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	res, err := config.DB.Exec("DELETE FROM patients WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete patient"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient deleted"})
}
