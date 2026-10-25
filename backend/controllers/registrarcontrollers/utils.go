package registrarcontrollers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	dac "github.com/Snawoot/go-http-digest-auth-client"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

func sendStudentToDevice(device adminmodels.Devices, student registrarmodels.Student) {
	username := os.Getenv("DEVICE_USERNAME")
	password := os.Getenv("DEVICE_PASSWORD")
	client := &http.Client{
		Transport: dac.NewDigestTransport(username, password, http.DefaultTransport),
	}
	apiURL := fmt.Sprintf("http://%s/cgi-bin/AccessUser.cgi?action=insertMulti", device.IPAddress)
	userData := map[string]interface{}{
		"UserID":   fmt.Sprintf("%d", student.ID),
		"UserName": fmt.Sprintf("%s %s %s", student.FirstName, student.FatherName, student.GrandFatherName),
		"UserType": func() int {
			if student.Status == registrarmodels.StatusActive {
				return 0
			}
			return 1
		}(),
		"UseTime":      1,
		"IsFirstEnter": true,
		"UserStatus":   0,
		"Authority":    2,
	}
	payload := map[string]interface{}{
		"UserList": []map[string]interface{}{userData},
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		slog.Error("device_payload_encode_failed", "error", err)
		return
	}
	resp, err := client.Post(apiURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		slog.Error("device_student_sync_failed", "error", err)
		return
	}
	defer resp.Body.Close()
}

// sendStudentToDevicesConcurrently sends student data to all devices concurrently.
func sendStudentToDevicesConcurrently(devices []adminmodels.Devices, student registrarmodels.Student) {
	var wg sync.WaitGroup
	for _, device := range devices {
		wg.Add(1)
		go func(device adminmodels.Devices) {
			defer wg.Done()
			sendStudentToDevice(device, student)
		}(device)
	}
	wg.Wait()
}

// shouldUpdateStudent compares two Student records and returns true if there are any differences.
func shouldUpdateStudent(existing, new registrarmodels.Student) bool {
	return existing.FirstName != new.FirstName ||
		existing.FatherName != new.FatherName ||
		existing.GrandFatherName != new.GrandFatherName ||
		existing.Email != new.Email ||
		existing.Phone != new.Phone ||
		existing.Sex != new.Sex ||
		!existing.DateOfBirth.Equal(new.DateOfBirth) ||
		existing.Program != new.Program ||
		existing.Section != new.Section ||
		existing.Year != new.Year ||
		existing.Semester != new.Semester ||
		existing.Religion != new.Religion ||
		existing.Status != new.Status
}

// parseDate parses a date string and returns a time.Time object.
func parseDate(dateStr string) time.Time {
	const layout = "2006-01-02"
	parsedDate, _ := time.Parse(layout, dateStr)
	return parsedDate
}

// fetchStudentDataFromSMS is a placeholder function that simulates data retrieval from an SMS service.
func fetchStudentDataFromSMS() ([]registrarmodels.Student, error) {
	return []registrarmodels.Student{
		{
			StudentID:       "ST1",
			FirstName:       "Yosef",
			FatherName:      "Alex",
			GrandFatherName: "Menge",
			Email:           "yosef@example.com",
			Phone:           "0982010311",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical Engineering",
			Section:         "C",
			Year:            5,
			Semester:        2,
			Religion:        "Muslim",
			RegisteredDate:  parseDate("2019-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST2",
			FirstName:       "Sol",
			FatherName:      "Asregdom",
			GrandFatherName: "Hailu",
			Email:           "solomon@example.com",
			Phone:           "0982010312",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Computer Science",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Muslim",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST3",
			FirstName:       "Muluken",
			FatherName:      "Hailu",
			GrandFatherName: "Abate",
			Email:           "muluken@example.com",
			Phone:           "0982010313",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Computer Science",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST4",
			FirstName:       "Misgan",
			FatherName:      "Moges",
			GrandFatherName: "Dereje",
			Email:           "misgan@example.com",
			Phone:           "0982010314",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Computer Science",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST5",
			FirstName:       "Abel",
			FatherName:      "Ayalew",
			GrandFatherName: "Kebede",
			Email:           "abel@example.com",
			Phone:           "0982010315",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST6",
			FirstName:       "Samuel",
			FatherName:      "gashu",
			GrandFatherName: "Abne",
			Email:           "sami@example.com",
			Phone:           "0982010316",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST7",
			FirstName:       "Minte",
			FatherName:      "Atnafu",
			GrandFatherName: "Abne",
			Email:           "minte@example.com",
			Phone:           "0982010317",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST8",
			FirstName:       "Dagnachew",
			FatherName:      "Atnafu",
			GrandFatherName: "Abne",
			Email:           "dagne@example.com",
			Phone:           "0982010318",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST9",
			FirstName:       "Yonas",
			FatherName:      "Adame",
			GrandFatherName: "Abne",
			Email:           "yonas@example.com",
			Phone:           "0982010319",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST10",
			FirstName:       "Hanna",
			FatherName:      "Andarge",
			GrandFatherName: "Abne",
			Email:           "hani@example.com",
			Phone:           "0982010310",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST11",
			FirstName:       "Emran",
			FatherName:      "Andarge",
			GrandFatherName: "Abne",
			Email:           "emran@example.com",
			Phone:           "0982010311",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
		{
			StudentID:       "ST12",
			FirstName:       "Beti",
			FatherName:      "Sol",
			GrandFatherName: "Andarge",
			Email:           "beti@example.com",
			Phone:           "0982010312",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusInactive,
		},
		{
			StudentID:       "ST13",
			FirstName:       "Beti2",
			FatherName:      "Sol2",
			GrandFatherName: "Andarge2",
			Email:           "beti1@example.com",
			Phone:           "0982010312",
			Sex:             registrarmodels.SexMale,
			DateOfBirth:     parseDate("2000-05-15"),
			Program:         "Electrical",
			Section:         "A",
			Year:            3,
			Semester:        1,
			Religion:        "Christianity",
			RegisteredDate:  parseDate("2023-08-10"),
			Status:          registrarmodels.StatusActive,
		},
	}, nil
}
