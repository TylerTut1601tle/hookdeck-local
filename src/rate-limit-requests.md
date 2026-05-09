# Rate Limit Requests

The rate limit endpoint analyzes stored requests and computes rate statistics over a configurable time window.

## Endpoint

```
GET /__hookdeck/rate-limit
```

## Query Parameters

| Parameter | Type   | Default | Description                                      |
|-----------|--------|---------|--------------------------------------------------|
| `window`  | number | `60`    | Time window in seconds to compute the rate over  |
| `url`     | string | —       | Filter by request URL prefix                     |
| `method`  | string | —       | Filter by HTTP method (e.g. `POST`)              |

## Response

```json
{
  "window": 60,
  "total": 42,
  "rate_per_second": 0.7,
  "rate_per_minute": 42,
  "breakdown": {
    "POST /webhook": 30,
    "GET /ping": 12
  }
}
```

### Fields

- **window**: The time window in seconds used for computation.
- **total**: Total number of requests within the window.
- **rate_per_second**: Average requests per second.
- **rate_per_minute**: Extrapolated requests per minute.
- **breakdown**: Request counts grouped by `METHOD path`.

## Example

```bash
# Default 60-second window
curl http://localhost:9090/__hookdeck/rate-limit

# Custom 5-minute window
curl "http://localhost:9090/__hookdeck/rate-limit?window=300"

# Filter by method
curl "http://localhost:9090/__hookdeck/rate-limit?method=POST"
```
