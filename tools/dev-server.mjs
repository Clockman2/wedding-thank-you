import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { appendFile, mkdir, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const port = Number.parseInt(process.env.PORT || "4173", 10);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function readBody(request, limit = 32768) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function cleanLogValue(value) {
  if (typeof value === "boolean" || typeof value === "number" || value === null) {
    return value;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return "[object]";
  }

  return String(value).replace(/[\r\n\t]+/g, " ").trim().slice(0, 500);
}

async function writeLocalLog(request) {
  if (request.method !== "POST") {
    return { status: 405, body: { ok: false, error: "POST only" } };
  }

  const rawBody = await readBody(request);
  const payload = JSON.parse(rawBody || "{}");
  const event = {
    server_time: new Date().toISOString(),
    ip: request.socket.remoteAddress || "",
    request_method: request.method || "",
    user_agent: request.headers["user-agent"] || "",
  };

  for (const [key, value] of Object.entries(payload)) {
    const cleanKey = key.replace(/[^a-zA-Z0-9_:-]/g, "_");
    event[cleanKey] = cleanLogValue(value);
  }

  const logParts = Object.entries(event).map(([key, value]) => `${key}=${JSON.stringify(String(value))}`);
  const logDir = join(root, "logs");
  await mkdir(logDir, { recursive: true });
  await appendFile(join(logDir, "access-log.txt"), `${logParts.join(" | ")}\n`, "utf8");

  return { status: 200, body: { ok: true } };
}

function resolvePath(urlPath) {
  let decodedPath = "/";

  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    decodedPath = "/";
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const candidate = normalize(join(root, relativePath));

  if (!candidate.startsWith(root)) {
    return null;
  }

  return candidate;
}

async function chooseFile(pathname) {
  const candidate = resolvePath(pathname);

  if (!candidate) {
    return null;
  }

  try {
    const fileStat = await stat(candidate);
    if (fileStat.isFile()) {
      return candidate;
    }
  } catch {
    return join(root, "index.html");
  }

  return join(root, "index.html");
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/log.php") {
    try {
      const result = await writeLocalLog(request);
      response.writeHead(result.status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      });
      response.end(JSON.stringify(result.body));
    } catch {
      response.writeHead(400, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      });
      response.end(JSON.stringify({ ok: false, error: "Could not write log" }));
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/logs/")) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  const filePath = await chooseFile(requestUrl.pathname);

  if (!filePath) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  response.writeHead(200, {
    "content-type": types[extname(filePath)] || "application/octet-stream",
    "cache-control": "no-store"
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Wedding thank-you site running at http://${host}:${port}`);
  console.log(`Serving ${root}`);
  console.log(`Try http://${host}:${port}/en/test-en`);
});
