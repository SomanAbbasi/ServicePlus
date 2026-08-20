import { eventHandler, toWebRequest } from "h3";
// @ts-ignore
import serverHandler from "../../dist/server/server.js";

export default eventHandler(async (event) => {
  const request = toWebRequest(event);
  return serverHandler.fetch(request, event.context, event);
});
