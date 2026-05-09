# Schedule Requests

The schedule feature allows you to replay a stored request after a specified delay.

## Endpoints

### `POST /__schedule?id=<requestId>&delay=<ms>`

Schedule a stored request to be replayed after `delay` milliseconds.

**Query Parameters:**

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| `id`      | string | Yes      | The ID of the stored request to replay   |
| `delay`   | number | Yes      | Delay in milliseconds before replay fires |

**Response:**

```json
{
  "requestId": "req-abc123",
  "delayMs": 5000,
  "scheduledAt": 1712345678901,
  "message": "Replay scheduled in 5000ms"
}
```

### `GET /__schedule`

List all currently pending scheduled replays.

**Response:**

```json
{
  "scheduled": [
    {
      "requestId": "req-abc123",
      "delayMs": 5000,
      "scheduledAt": 1712345678901
    }
  ],
  "count": 1
}
```

### `DELETE /__schedule?id=<requestId>`

Cancel a pending scheduled replay before it fires.

**Response:**

```json
{
  "cancelled": true,
  "requestId": "req-abc123"
}
```

## Notes

- Scheduling the same request ID twice will cancel the previous timer and replace it.
- Scheduled replays are held in memory and will be lost if the process restarts.
- The `delay` value must be a non-negative integer (milliseconds).
