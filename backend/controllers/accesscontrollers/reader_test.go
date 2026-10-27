package accesscontrollers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestReaderRejectsBadSignatureAndStaleTimestamp(t *testing.T) {
	t.Setenv("READER_HMAC_KEYS", `{"north-01":"a-reader-secret-with-more-than-32-bytes"}`)
	body := `{"event_id":"event-0001","reader_id":"north-01","card_number":"12345678","location":"gate","station":"North"}`
	for _, test := range []struct {
		name, timestamp, signature string
	}{
		{"bad signature", strconv.FormatInt(time.Now().Unix(), 10), strings.Repeat("0", 64)},
		{"stale timestamp", strconv.FormatInt(time.Now().Add(-10*time.Minute).Unix(), 10), ""},
	} {
		t.Run(test.name, func(t *testing.T) {
			mac := hmac.New(sha256.New, []byte("a-reader-secret-with-more-than-32-bytes"))
			mac.Write([]byte(test.timestamp + "\n" + body))
			signature := test.signature
			if signature == "" {
				signature = hex.EncodeToString(mac.Sum(nil))
			}
			request := httptest.NewRequest(http.MethodPost, "/api/v1/access/reader-events", strings.NewReader(body))
			request.Header.Set("X-Reader-Timestamp", test.timestamp)
			request.Header.Set("X-Reader-Signature", signature)
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = request
			ReceiveReaderEvent(ctx, nil)
			if recorder.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d", recorder.Code)
			}
		})
	}
}
