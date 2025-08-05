package config

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func ConnectDB() {
	connStr := ("host=localhost port=5432 user=postgres password=subang2005 dbname=hospital_db sslmode=disable")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		panic(err)
	}

	DB = db
	fmt.Println("Connected to PostgreSQL!")
}
