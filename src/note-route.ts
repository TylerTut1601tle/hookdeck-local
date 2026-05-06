import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createNoteRequestsHandler } from "./note-requests";

export function createNoteRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createNoteRequestsHandler(store);

  return (req, res) => {
    // Match PATCH /requests/:id/note
    if (
      req.method === "PATCH" &&
      req.url !== undefined &&
      /^\/requests\/[^/]+\/note$/.test(req.url)
    ) {
      handler(req, res);
      return true;
    }
    return false;
  };
}
