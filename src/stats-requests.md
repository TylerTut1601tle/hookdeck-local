# Stats Requests

The `/__hookdeck/stats` endpoint provides aggregated statistics about all requests captured by the proxy.

## Endpoint

```
GET /__hookdeck/stats
```

## Response

Returns a JSON object with the following fields:

| Field | Type | Description |
|---|---|---|
| `total` | `number` | Total number of captured requests |
| `byMethod` | `Record<string, number>` | Count of requests grouped by HTTP method |
| `byStatus` | `Record<string, number>` | Count of requests grouped by response status code |
| `byPath` | `Record<string, number>` | Count of requests grouped by request path |
| `averageResponseTime` | `number \| null` | Average response duration in milliseconds, or `null` if unavailable |

## Example

```bash
curl http://localhost:9000/__hookdeck/stats
```

```json
{
  "total": 42,
  "byMethod": {
    "POST": 38,
    "GET": 4
  },
  "byStatus": {
    "200": 35,
    "404": 5,
    "500": 2
  },
  "byPath": {
    "/webhooks/github": 20,
    "/webhooks/stripe": 18,
    "/health": 4
  },
  "averageResponseTime": 124
}
```
