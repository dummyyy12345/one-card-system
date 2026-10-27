# Generic reader decision API

This API lets a connected reader request a live access decision. A reader sends JSON to `POST /api/v1/access/reader-events` over HTTPS and uses the returned `decision` before opening a door or turnstile. The server checks the registered device, current policy, and student record, then persists one audit event. A vendor-specific bridge can translate its native reader protocol to this JSON contract.

## Configure a reader

1. Add the device in the admin device screen. Its `serial_number` must equal the `reader_id` below, and its `location` must equal one of `gate`, `cafeteria`, `dormitory`, or `library`.
2. Set `READER_HMAC_KEYS` to a JSON object mapping each reader ID to a distinct random secret of at least 32 bytes, for example `{"north-gate-01":"replace-with-a-random-secret-of-at-least-32-bytes"}`. Store the matching secret on the reader or its bridge. Restart the API after changing keys.
3. Synchronize reader and server clocks. The request timestamp can differ by at most five minutes.

Keep the API behind TLS and restrict the reader endpoint to the device network. Treat the keys as credentials; never put them in a browser or source control.

## Request

```http
POST /api/v1/access/reader-events HTTP/1.1
Content-Type: application/json
X-Reader-Timestamp: 1793100000
X-Reader-Signature: <lowercase hex HMAC-SHA256>

{"event_id":"north-gate-01-000001","reader_id":"north-gate-01","card_number":"12345678","location":"gate","station":"North entrance"}
```

`event_id` must be globally unique across all readers (a UUID or reader-prefixed sequence works) and contain 8–80 ASCII letters, digits, `_`, or `-`. Reusing an ID from another reader returns HTTP 409. `reader_id` must match a registered device (maximum 255 characters). `card_number` is 1–128 characters and `station` is 1–64 characters. The body must be at most 4096 bytes.

Compute the signature as lowercase hexadecimal `HMAC-SHA256(reader_secret, ASCII(timestamp) + "\n" + exact_request_body_bytes)`. The timestamp is Unix seconds. Any whitespace change in the JSON body changes the signature. Do not include the angle brackets around the signature.

Example Python signing logic:

```python
import hashlib, hmac, json, time

body = json.dumps({
    "event_id": "north-gate-01-000001",
    "reader_id": "north-gate-01",
    "card_number": "12345678",
    "location": "gate",
    "station": "North entrance",
}, separators=(",", ":")).encode()
timestamp = str(int(time.time()))
signature = hmac.new(
    reader_secret.encode(), timestamp.encode() + b"\n" + body, hashlib.sha256
).hexdigest()
# POST body with X-Reader-Timestamp and X-Reader-Signature headers.
```

## Response and retries

```json
{"decision":"allowed","reason":"eligible","event_id":42,"policy_version":1}
```

Only `decision: "allowed"` authorizes entry. `denied` responses include reasons such as `unknown_card`, `inactive_student`, `not_assigned`, `outside_hours`, and `location_closed`. The response never includes student identity. A 4xx or 5xx response is not an authorization; the reader must keep the door locked.

If a request times out, resend the **same** `event_id` with a fresh timestamp and signature. The API returns the original decision and does not create a second audit event. Readers can keep unsent events in a local outbox, but an offline reader cannot obtain a new server decision until connectivity returns. This protocol does not grant access from cached student data.

The admin access screen controls location hours, days, assignment requirements, and temporary assignment exceptions. All times are UTC. Policy changes affect subsequent decisions and are stored as revisions. Access events store the policy version used.
