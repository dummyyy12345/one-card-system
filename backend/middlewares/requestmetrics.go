package middlewares

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/opsmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gorm.io/gorm"
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

// AttachDatabase exports low-cardinality operational gauges without student data.
func (metrics *RequestMetrics) AttachDatabase(db *gorm.DB) {
	metrics.registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{Name: "onecard_database_up", Help: "Whether PostgreSQL responds to a one-second ping."}, func() float64 {
		sqlDB, err := db.DB()
		if err != nil {
			return 0
		}
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if sqlDB.PingContext(ctx) != nil {
			return 0
		}
		return 1
	}))
	for _, status := range []string{"pending", "processing", "failed"} {
		status := status
		metrics.registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{
			Name: "onecard_device_sync_jobs", Help: "Device deliveries by status.", ConstLabels: prometheus.Labels{"status": status},
		}, func() float64 {
			var count int64
			if db.Model(&registrarmodels.DeviceSyncJob{}).Where("status = ?", status).Count(&count).Error != nil {
				return 0
			}
			return float64(count)
		}))
	}
	metrics.registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{Name: "onecard_device_sync_oldest_age_seconds", Help: "Age of oldest unsynchronized device delivery."}, func() float64 {
		var job registrarmodels.DeviceSyncJob
		if db.Where("status IN ?", []string{"pending", "processing", "failed"}).Order("created_at ASC").First(&job).Error != nil {
			return 0
		}
		return time.Since(job.CreatedAt).Seconds()
	}))
	metrics.registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{Name: "onecard_access_denials_1h", Help: "Denied access events in the last hour."}, func() float64 {
		var count int64
		if db.Model(&accessmodels.AccessEvent{}).Where("decision = ? AND created_at >= ?", "denied", time.Now().Add(-time.Hour)).Count(&count).Error != nil {
			return 0
		}
		return float64(count)
	}))
	metrics.registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{Name: "onecard_source_sync_last_success_timestamp_seconds", Help: "UTC timestamp of last successful source import."}, func() float64 {
		var state opsmodels.SyncState
		if db.First(&state, "key = ?", "student_source").Error != nil || state.LastSuccessAt == nil {
			return 0
		}
		return float64(state.LastSuccessAt.Unix())
	}))
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
