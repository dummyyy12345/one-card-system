package middlewares

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// RequestMetrics keeps metrics scoped to one server instance.
type RequestMetrics struct {
	registry *prometheus.Registry
	requests *prometheus.CounterVec
}

func NewRequestMetrics() *RequestMetrics {
	registry := prometheus.NewRegistry()
	requests := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "onecard_http_requests_total",
		Help: "Total HTTP requests by method, route, and status.",
	}, []string{"method", "route", "status"})
	registry.MustRegister(requests)
	return &RequestMetrics{registry: registry, requests: requests}
}

func (metrics *RequestMetrics) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		route := c.FullPath()
		if route == "" {
			route = "(unmatched)"
		}
		metrics.requests.WithLabelValues(c.Request.Method, route, strconv.Itoa(c.Writer.Status())).Inc()
	}
}

func (metrics *RequestMetrics) Handler() http.Handler {
	return promhttp.HandlerFor(metrics.registry, promhttp.HandlerOpts{})
}
