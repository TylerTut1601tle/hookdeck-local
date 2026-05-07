# Duplicate Requests

The duplicate feature allows you to clone an existing stored request, creating a new entry with the same method, URL, headers, body, and tags.

## Endpoint

```
POST /requests/:id/duplicate
```

## Description

Creates a copy of the request identified by `:id`. The duplicated request:

- Gets a new unique `id`
- Gets a fresh `timestamp` set to the current time
- Inherits `method`, `url`, `headers`, `body`, and `tags` from the original
- Has `bookmarked` set to `false`
- Has `archived` set to `false`
- Has `status` and `duration` reset to `null`
- Has `note` prefixed with `[Duplicate of <original-id>]`

## Response

**201 Created** — Returns the newly created duplicate request object.

```json
{
  "id": "new-unique-id",
  "method": "POST",
  "url": "/webhook",
  "headers": { "content-type": "application/json" },
  "body": "{\"event\":\"test\"}",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": null,
  "duration": null,
  "tags": ["production"],
  "note": "[Duplicate of abc123] original note",
  "bookmarked": false,
  "archived": false
}
```

## Error Responses

- **400 Bad Request** — Missing or invalid request ID.
- **404 Not Found** — No request found with the given ID.

## Use Case

Useful when you want to replay a request with slight modifications — duplicate it first, then edit the copy before replaying.
