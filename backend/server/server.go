package server

import (
	"log/slog"
	"os"

	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/SolomonAHailu/one-card-system/routes"
	"github.com/gin-gonic/gin"
)

type Server struct {
	Router *gin.Engine
}

func NewServer() *Server {
	router := gin.New()
	metrics := middlewares.NewRequestMetrics()
	if initializers.DB != nil {
		metrics.AttachDatabase(initializers.DB)
	}
	router.Use(gin.Recovery(), middlewares.RequestLogger(slog.New(slog.NewJSONHandler(os.Stdout, nil))), metrics.Middleware())
	router.GET("/metrics", gin.WrapH(metrics.Handler()))
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
