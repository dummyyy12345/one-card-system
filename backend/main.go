package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/server"
	"github.com/SolomonAHailu/one-card-system/services"
)

func init() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	initializers.LoadEnvVariables()
	initializers.ConnectToDB(os.Getenv("DB_DRIVER"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_PORT"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME"))
}

func main() {
	if initializers.DB == nil {
		slog.Error("database_unavailable")
		os.Exit(1)
	}

	// Start the sync process in a separate goroutine
	go services.StartSync()
	go services.StartDeviceSync(initializers.DB)

	s := server.NewServer()
	s.Initialize()
	serverPort := fmt.Sprintf(":%s", os.Getenv("API_PORT"))
	s.Run(serverPort)
}
