import { readConnection, saveConnection } from "../shared/connection";
import { readHeld, releaseHeld } from "../shared/held";
import { fail, ok } from "../shared/messages";
import type { Connection, Reply, Request } from "../shared/types";
import { answerWithClaude, helperStatus } from "./claude";
import { boostResume, checkConnection, fetchFillData, fetchPdf, importJob, reportApplied, writeAnswers } from "./api";

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
    case "pdf":
      return withConnection((connection) => fetchPdf(connection, request.path));
    case "applied":
      return withConnection((connection) => reportApplied(connection, request.applicationPublicId));
    case "boost":
      return withConnection((connection) => boostResume(connection, request.applicationPublicId));
    case "import":
      return withConnection((connection) => importJob(connection, request.page));
    case "answers":
      return withConnection((connection) => writeAnswers(connection, request.body));
    case "claude-answers":
      return withConnection((connection) => answerWithClaude(connection, request.body));
    case "claude-status":
      return ok(await helperStatus());
    case "held":
      return ok(await readHeld());
    case "release":
      await releaseHeld();
      return ok(true);
    case "save-connection":
      return acceptConnection(request.connection, sender);
    default:
      return fail("Unknown request.");
  }
}

chrome.runtime.onMessage.addListener((request: Request, sender, respond) => {
  if (sender.id !== chrome.runtime.id || request.type === "fill" || request.type === "capture" || request.type === "ping") {
    return false;
  }

  void handle(request, sender).then(respond);

  return true;
});
