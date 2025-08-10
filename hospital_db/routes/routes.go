package routes

import (
	"nama-module/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Auth routes
	r.POST("/login", controllers.Login)
	r.POST("/forgot-password", controllers.ForgotPassword)
	r.POST("/reset-password", controllers.ResetPassword)

	// Patient routes
	r.GET("/patients", controllers.GetPatients)
	r.GET("/patients/:id", controllers.GetPatientById)
	r.POST("/patients", controllers.CreatePatient)
	r.PUT("/patients/:id", controllers.UpdatePatient)
	r.DELETE("/patients/:id", controllers.DeletePatient)

	// Doctor routes
	r.GET("/doctors", controllers.GetDoctors)
	r.GET("/doctors/:id", controllers.GetDoctorById)
	r.POST("/doctors", controllers.CreateDoctor)
	r.PUT("/doctors/:id", controllers.UpdateDoctor)
	r.DELETE("/doctors/:id", controllers.DeleteDoctor)
}
