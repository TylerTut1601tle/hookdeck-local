# Export Requests

The export feature allows you to download all stored webhook requests in multiple formats for offline analysis, debugging, or sharing.

## Endpoint

```
GET /__hookdeck/export
```

## Query Parameters

| Parameter | Values              | Default | Description                          |
|-----------|---------------------|---------|--------------------------------------|
| `format`  | `json`, `ndjson`, `csv` | `json`  | Output format for the exported data |

## Formats

### JSON (`format=json`)

Returns a pretty-printed JSON array of all stored requests.

```bash
curl http://localhost:9000/__hookdeck/export > requests.json
```

### NDJSON (`format=ndjson`)

Newline-delimited JSON — one request object per line. Useful for streaming or large datasets.

```bash
curl "http://localhost:9000/__hookdeck/export?format=ndjson" > requests.ndjson
```

### CSV (`format=csv`)

Comma-separated values with columns: `id`, `method`, `url`, `status`, `timestamp`.

```bash
curl "http://localhost:9000/__hookdeck/export?format=csv" > requests.csv
```

## Response Headers

All formats include a `Content-Disposition: attachment` header so browsers will prompt a file download automatically.
