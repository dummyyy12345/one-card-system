package registrarcontrollers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	dac "github.com/Snawoot/go-http-digest-auth-client"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

// DeviceClient separates hardware I/O from student updates.
type DeviceClient interface {
	Check(context.Context, adminmodels.Devices) error
	UpdateCard(context.Context, adminmodels.Devices, registrarmodels.Student, string) error
	UpdatePhoto(context.Context, adminmodels.Devices, registrarmodels.Student, bool) error
}

type digestDeviceClient struct {
	httpClient *http.Client
}

func newDigestDeviceClient() DeviceClient {
	return &digestDeviceClient{httpClient: &http.Client{
		Timeout:   5 * time.Second,
		Transport: dac.NewDigestTransport(os.Getenv("DEVICE_USERNAME"), os.Getenv("DEVICE_PASSWORD"), http.DefaultTransport),
	}}
}

func deviceURL(device adminmodels.Devices, path string, query url.Values) string {
	return (&url.URL{Scheme: "http", Host: device.IPAddress, Path: path, RawQuery: query.Encode()}).String()
}

func (client *digestDeviceClient) send(ctx context.Context, method, endpoint string, payload any) error {
	var body *bytes.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return fmt.Errorf("encode device request: %w", err)
		}
		body = bytes.NewReader(encoded)
	} else {
		body = bytes.NewReader(nil)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return fmt.Errorf("create device request: %w", err)
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := client.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("device request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("device returned HTTP %d", resp.StatusCode)
	}
	return nil
}

func (client *digestDeviceClient) Check(ctx context.Context, device adminmodels.Devices) error {
	return client.send(ctx, http.MethodGet, deviceURL(device, "/cgi-bin/AccessUser.cgi", url.Values{"action": {"fetch"}}), nil)
}

func (client *digestDeviceClient) UpdateCard(ctx context.Context, device adminmodels.Devices, student registrarmodels.Student, previous string) error {
	if previous != "" {
		query := url.Values{"action": {"removeMulti"}, "CardNoList[0]": {previous}}
		if err := client.send(ctx, http.MethodDelete, deviceURL(device, "/cgi-bin/AccessCard.cgi", query), nil); err != nil {
			return err
		}
	}
	if student.CardNumber == nil || *student.CardNumber == "" {
		return nil
	}
	payload := map[string]any{"CardList": []map[string]string{{
		"UserID": strconv.FormatUint(uint64(student.ID), 10),
		"CardNo": *student.CardNumber,
	}}}
	return client.send(ctx, http.MethodPost, deviceURL(device, "/cgi-bin/AccessCard.cgi", url.Values{"action": {"insertMulti"}}), payload)
}

func (client *digestDeviceClient) UpdatePhoto(ctx context.Context, device adminmodels.Devices, student registrarmodels.Student, hadPhoto bool) error {
	action := "insertMulti"
	if hadPhoto {
		action = "updateMulti"
	}
	photo := ""
	if student.Photo != nil {
		photo = *student.Photo
	}
	payload := map[string]any{"FaceList": []map[string]any{{
		"UserID":    strconv.FormatUint(uint64(student.ID), 10),
		"PhotoData": []string{photo},
	}}}
	return client.send(ctx, http.MethodPost, deviceURL(device, "/cgi-bin/AccessFace.cgi", url.Values{"action": {action}}), payload)
}
