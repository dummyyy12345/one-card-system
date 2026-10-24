package server

import (
	"log/slog"
	"os"

	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/SolomonAHailu/one-card-system/routes"
	"github.com/gin-gonic/gin"
)

type Server struct {
	Router *gin.Engine
}

func NewServer() *Server {
	router := gin.New()
	router.Use(gin.Recovery(), middlewares.RequestLogger(slog.New(slog.NewJSONHandler(os.Stdout, nil))))
	return &Server{
		Router: router,
	}
}

func (s *Server) Initialize() {
	s.Router.Use(middlewares.CORSMiddleware())
	routes.RegisterRoutes(s.Router)
}

func (s *Server) Run(addr string) {
	s.Router.Run(addr)
}
