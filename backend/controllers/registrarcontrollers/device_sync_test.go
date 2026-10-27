package registrarcontrollers

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"gorm.io/gorm"
)

func TestDeviceSyncChecksHTTPStatusAndRetriesWithCap(t *testing.T) {
	status := http.StatusServiceUnavailable
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/cgi-bin/AccessUser.cgi" || r.URL.Query().Get("action") != "insertMulti" {
			t.Errorf("unexpected device path: %s", r.URL.String())
		}
		w.WriteHeader(status)
	}))
	defer server.Close()
	host, portString, err := net.SplitHostPort(server.Listener.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	port, _ := strconv.Atoi(portString)
	device := adminmodels.Devices{IPAddress: host, Port: port}
	student := registrarmodels.Student{Model: gorm.Model{ID: 7}, FirstName: "Ada", Status: registrarmodels.StatusActive}
	if err := sendStudentToDevice(context.Background(), device, student); err == nil {
		t.Fatal("HTTP 503 must be treated as a failed delivery")
	}
	status = http.StatusOK
	if err := sendStudentToDevice(context.Background(), device, student); err != nil {
		t.Fatalf("successful delivery: %v", err)
	}
	if retryDelay(1) != time.Minute || retryDelay(10) != 32*time.Minute {
		t.Fatal("retry delays should grow and cap at 32 minutes")
	}
}
