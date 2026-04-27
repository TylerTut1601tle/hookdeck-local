# hookdeck-local

Lightweight webhook relay proxy for local development with request logging and replay functionality.

## Installation

```bash
npm install -g hookdeck-local
```

## Usage

Start the proxy and forward incoming webhooks to your local server:

```bash
hookdeck-local --port 3000 --target http://localhost:8080/webhooks
```

You can also use it programmatically in your project:

```ts
import { createProxy } from "hookdeck-local";

const proxy = createProxy({
  port: 3000,
  target: "http://localhost:8080/webhooks",
  logRequests: true,
});

proxy.start();
```

Once running, point your webhook provider to the public URL displayed in the terminal. All incoming requests will be forwarded to your local target, logged to the console, and stored for replay.

### Replay a Request

```bash
hookdeck-local replay --id <request-id>
```

## Options

| Flag            | Default     | Description                        |
|-----------------|-------------|------------------------------------|
| `--port`        | `3000`      | Local port to listen on            |
| `--target`      | required    | Local URL to forward requests to   |
| `--log`         | `true`      | Enable request logging             |
| `--replay`      | `false`     | Start in replay mode               |

## Requirements

- Node.js >= 16
- npm or yarn

## License

MIT © hookdeck-local contributors