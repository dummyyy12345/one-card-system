package initializers

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// ConnectToDB establishes a connection to the database based on the provided driver and credentials.
func ConnectToDB(DbDriver, DbUser, DbPassword, DbPort, DbHost, DbName string) {
	var err error

	if DbDriver == "mysql" {
		DBURL := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8&parseTime=True&loc=Local", DbUser, DbPassword, DbHost, DbPort, DbName)
		DB, err = gorm.Open(mysql.Open(DBURL), &gorm.Config{})
		if err != nil {
			log.Fatalf("Cannot connect to %s database: %v", DbDriver, err)
		} else {
			fmt.Printf("We are connected to the %s database\n", DbDriver)
		}

	} else if DbDriver == "postgres" {
		sslMode := os.Getenv("DB_SSLMODE")
		if sslMode == "" {
			sslMode = "require"
		}
		DBURL := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=%s", DbHost, DbPort, DbUser, DbName, DbPassword, sslMode)
		DB, err = gorm.Open(postgres.Open(DBURL), &gorm.Config{})
		if err != nil {
			log.Fatalf("Cannot connect to %s database: %v", DbDriver, err)
		} else {
			fmt.Printf("We are connected to the %s database\n", DbDriver)
		}
	} else {
		log.Fatal("UNKNOWN DRIVER")
	}
}
