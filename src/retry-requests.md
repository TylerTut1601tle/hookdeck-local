# Retry Requests

The retry endpoint allows replaying one or more stored requests against the configured target URL.

## Endpoint

```
GET /_hookdeck/retry?id=<id>[&id=<id>...]
POST /_hookdeck/retry?id=<id>[&id=<id>...]
```

## Query Parameters

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `id`      | string | Yes      | ID of a stored request to retry. Repeat for multiple. |

## Response

### 200 OK — all retries succeeded

```json
{
  "results": [
    { "id": "abc123", "success": true, "statusCode": 200 }
  ]
}
```

### 207 Multi-Status — some retries failed

```json
{
  "results": [
    { "id": "abc123", "success": true, "statusCode": 200 },
    { "id": "missing", "success": false, "error": "Not found" }
  ]
}
```

### 400 Bad Request — no ids provided

```json
{ "error": "At least one id query param is required" }
```

## Notes

- A retry is considered successful when the upstream responds with a status code below 500.
- Network errors are caught and reported per-request without aborting the batch.
- Retried requests are **not** re-stored; use the import or duplicate endpoints if persistence is needed.
