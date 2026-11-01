package initializers

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

func LoadEnvVariables() {
	currentDir, err := os.Getwd()
	if err != nil {
		slog.Error("working_directory_unavailable", "error_type", fmt.Sprintf("%T", err))
		os.Exit(1)
	}
	envPath := filepath.Join(currentDir, ".env")

	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		defaultPath := filepath.Join("../", ".env")
		slog.Info("environment_file_fallback", "location", "parent")
		envPath = defaultPath
	}

	// Containers and CI supply environment variables directly. A local .env is optional.
	if _, err := os.Stat(envPath); err == nil {
		if err := godotenv.Load(envPath); err != nil {
			slog.Warn("environment_file_load_failed", "error_type", fmt.Sprintf("%T", err))
		}
	}
}
