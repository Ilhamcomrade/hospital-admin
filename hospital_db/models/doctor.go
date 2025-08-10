package models

type Doctor struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Specialization string `json:"specialization"`
	Contact        string `json:"contact"`
	Photo          string `json:"photo"`
}
