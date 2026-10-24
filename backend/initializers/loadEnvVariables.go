package initializers

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

func LoadEnvVariables() {
	currentDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("Error getting current working directory: %v", err)
	}
	envPath := filepath.Join(currentDir, ".env")

	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		defaultPath := filepath.Join("../", ".env")
		log.Printf("Defaulting to .env file at %s", defaultPath)
		envPath = defaultPath
	}

	// Containers and CI supply environment variables directly. A local .env is optional.
	if _, err := os.Stat(envPath); err == nil {
		if err := godotenv.Load(envPath); err != nil {
			log.Printf("Could not load %s: %v", envPath, err)
		}
	}
}
