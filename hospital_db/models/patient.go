package models

type Patient struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	BirthDate string `json:"birth_date"`
	Gender    string `json:"gender"`
	Address   string `json:"address"`
	Contact   string `json:"contact"`
	VisitDate string `json:"visit_date"`
	Complaint string `json:"complaint"`
	CreatedAt string `json:"created_at,omitempty"`
}
