package registrarcontrollers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"gorm.io/gorm"
)

func TestDeviceClientCardAndPhotoRequests(t *testing.T) {
	var requests []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests = append(requests, r.Method+" "+r.URL.Path+"?"+r.URL.RawQuery)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()
	device := adminmodels.Devices{IPAddress: strings.TrimPrefix(server.URL, "http://")}
	client := &digestDeviceClient{httpClient: server.Client()}
	card, photo := "87654321", "base64-image"
	student := registrarmodels.Student{Model: gorm.Model{ID: 7}, CardNumber: &card, Photo: &photo}
	ctx := context.Background()
	if err := client.Check(ctx, device); err != nil {
		t.Fatal(err)
	}
	if err := client.UpdateCard(ctx, device, student, "12345678"); err != nil {
		t.Fatal(err)
	}
	if err := client.UpdatePhoto(ctx, device, student, false); err != nil {
		t.Fatal(err)
	}
	if len(requests) != 4 || !strings.Contains(requests[1], "removeMulti") || !strings.Contains(requests[2], "insertMulti") || !strings.Contains(requests[3], "AccessFace.cgi") {
		t.Fatalf("unexpected device requests: %v", requests)
	}
}

func TestDeviceClientRejectsHTTPFailures(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()
	client := &digestDeviceClient{httpClient: server.Client()}
	device := adminmodels.Devices{IPAddress: strings.TrimPrefix(server.URL, "http://")}
	if err := client.Check(context.Background(), device); err == nil {
		t.Fatal("non-success device response should fail")
	}
}
