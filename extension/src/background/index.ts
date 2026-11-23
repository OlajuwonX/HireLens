import { readConnection, saveConnection } from "../shared/connection";
import { fail, ok } from "../shared/messages";
import type { Connection, Reply, Request } from "../shared/types";
import { checkConnection, fetchFillData, fetchResume, reportApplied } from "./api";

async function withConnection<T>(run: (connection: Connection) => Promise<T>): Promise<Reply<T>> {
  const connection = await readConnection();

  if (!connection) {
    return fail("Connect the HireLens extension to your account first.");
  }

  try {
    return ok(await run(connection));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "HireLens could not be reached.");
  }
}

async function acceptConnection(connection: Connection, sender: chrome.runtime.MessageSender) {
  if (!sender.url || new URL(sender.url).origin !== connection.origin) {
    return fail("This page cannot connect the extension.");
  }

  try {
    await checkConnection(connection);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "HireLens could not be reached.");
  }

  await saveConnection(connection);

  return ok(true);
}

async function handle(request: Request, sender: chrome.runtime.MessageSender): Promise<Reply<unknown>> {
  switch (request.type) {
    case "fill-data":
      return withConnection((connection) => fetchFillData(connection, request.url));
    case "resume":
      return withConnection((connection) => fetchResume(connection, request.path));
    case "applied":
      return withConnection((connection) => reportApplied(connection, request.applicationPublicId));
    case "save-connection":
      return acceptConnection(request.connection, sender);
    default:
      return fail("Unknown request.");
  }
}

chrome.runtime.onMessage.addListener((request: Request, sender, respond) => {
  if (sender.id !== chrome.runtime.id || request.type === "fill" || request.type === "ping") {
    return false;
  }

  void handle(request, sender).then(respond);

  return true;
});
