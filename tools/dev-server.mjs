import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { appendFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
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
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
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

function readBuffer(request, limit = 9 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Request body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
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

function cleanText(value, maxLength = 500) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLength);
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

async function readJsonLines(filePath, limit = 24) {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .reverse()
      .slice(0, limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

async function handleGuestbook(request) {
  const logDir = join(root, "logs");
  const guestbookFile = join(logDir, "guestbook.jsonl");
  const pendingGuestbookFile = join(logDir, "pending-guestbook.jsonl");

  if (request.method === "GET") {
    const entries = await readJsonLines(guestbookFile);
    return { status: 200, body: { ok: true, entries } };
  }

  if (request.method !== "POST") {
    return { status: 405, body: { ok: false, error: "GET or POST only" } };
  }

  const payload = JSON.parse(await readBody(request, 16384) || "{}");
  const entry = {
    server_time: new Date().toISOString(),
    ip: request.socket.remoteAddress || "",
    user_agent: request.headers["user-agent"] || "",
    guest_key: cleanText(payload.guest_key, 120) || "default",
    language: cleanText(payload.language, 20),
    name: cleanText(payload.name, 80),
    message: cleanText(payload.message, 900)
  };

  if (!entry.name || !entry.message) {
    return { status: 400, body: { ok: false, error: "Name and message are required" } };
  }

  await mkdir(logDir, { recursive: true });
  await appendFile(pendingGuestbookFile, `${JSON.stringify(entry)}\n`, "utf8");
  const entries = await readJsonLines(guestbookFile);

  return {
    status: 200,
    body: {
      ok: true,
      pending: true,
      review_file: "logs/pending-guestbook.jsonl",
      entries
    }
  };
}

function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[2];

  if (!boundary) {
    throw new Error("Missing boundary");
  }

  const parts = buffer.toString("latin1").split(`--${boundary}`);
  const fields = {};
  let file = null;

  for (const rawPart of parts) {
    const part = rawPart.replace(/^\r\n/, "").replace(/\r\n$/, "");
    const headerEnd = part.indexOf("\r\n\r\n");

    if (headerEnd === -1) {
      continue;
    }

    const headerText = part.slice(0, headerEnd);
    const bodyText = part.slice(headerEnd + 4);
    const name = headerText.match(/name="([^"]+)"/i)?.[1] || "";
    const filename = headerText.match(/filename="([^"]*)"/i)?.[1] || "";
    const mime = headerText.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "";

    if (!name) {
      continue;
    }

    if (filename) {
      file = {
        name,
        filename,
        mime,
        bytes: Buffer.from(bodyText, "latin1")
      };
    } else {
      fields[name] = Buffer.from(bodyText, "latin1").toString("utf8").trim();
    }
  }

  return { fields, file };
}

async function handlePhotoUpload(request) {
  const pendingUploadDir = join(root, "uploads", "pending-photos");
  const logDir = join(root, "logs");
  const uploadLog = join(logDir, "uploads.jsonl");
  const pendingUploadLog = join(logDir, "pending-uploads.jsonl");

  if (request.method === "GET") {
    const photos = await readJsonLines(uploadLog);
    return { status: 200, body: { ok: true, photos } };
  }

  if (request.method !== "POST") {
    return { status: 405, body: { ok: false, error: "GET or POST only" } };
  }

  const contentType = request.headers["content-type"] || "";
  const { fields, file } = parseMultipart(await readBuffer(request), contentType);
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  const extension = extensions[file?.mime || ""];

  if (!file || !extension || file.bytes.length === 0 || file.bytes.length > 8 * 1024 * 1024) {
    return { status: 400, body: { ok: false, error: "Invalid image upload" } };
  }

  await mkdir(pendingUploadDir, { recursive: true });
  await mkdir(logDir, { recursive: true });

  const fileName = `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomBytes(4).toString("hex")}.${extension}`;
  const pendingUrl = `/uploads/pending-photos/${fileName}`;
  const approvedUrl = `/uploads/guest-photos/${fileName}`;
  await writeFile(join(pendingUploadDir, fileName), file.bytes);

  const entry = {
    server_time: new Date().toISOString(),
    ip: request.socket.remoteAddress || "",
    user_agent: request.headers["user-agent"] || "",
    guest_key: cleanText(fields.guest_key, 120) || "default",
    language: cleanText(fields.language, 20),
    name: cleanText(fields.name, 80),
    file: fileName,
    url: approvedUrl,
    pending_url: pendingUrl,
    size: file.bytes.length,
    mime: file.mime
  };

  await appendFile(pendingUploadLog, `${JSON.stringify(entry)}\n`, "utf8");
  const photos = await readJsonLines(uploadLog);

  return {
    status: 200,
    body: {
      ok: true,
      pending: true,
      file: fileName,
      url: pendingUrl,
      approved_url: approvedUrl,
      review_file: "logs/pending-uploads.jsonl",
      review_folder: "uploads/pending-photos",
      photos
    }
  };
}

function captionFromFilename(filename) {
  const text = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return { en: text, pt: text };
}

async function handleGallery() {
  const galleryDir = join(root, "assets", "gallery");
  const uploadLog = join(root, "logs", "uploads.jsonl");
  const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const photos = [];

  try {
    const files = await readdir(galleryDir);
    files
      .filter((file) => allowedExtensions.has(extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .forEach((file) => {
        photos.push({
          url: `/assets/gallery/${encodeURIComponent(file)}`,
          rotation: photos.length % 2 === 0 ? "-2.1deg" : "1.8deg",
          caption: captionFromFilename(file)
        });
      });
  } catch {
    // The static config still provides a gallery fallback when the folder is empty.
  }

  const approvedUploads = await readJsonLines(uploadLog);
  approvedUploads.forEach((photo) => {
    if (!photo.url) {
      return;
    }

    photos.push({
      url: photo.url,
      rotation: photos.length % 2 === 0 ? "-1.7deg" : "2deg",
      caption: {
        en: photo.name ? `Shared by ${photo.name}` : "Shared by a guest",
        pt: photo.name ? `Enviada por ${photo.name}` : "Enviada por um convidado"
      }
    });
  });

  return { status: 200, body: { ok: true, photos } };
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
      return { path: candidate, status: 200 };
    }
  } catch {
    if (pathname === "/" || /^\/(en|pt)(\/|$)/.test(pathname)) {
      return { path: join(root, "index.html"), status: 200 };
    }

    return { path: join(root, "404.html"), status: 404 };
  }

  return { path: join(root, "404.html"), status: 404 };
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  async function sendJsonResult(handler) {
    try {
      const result = await handler(request);
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
      response.end(JSON.stringify({ ok: false, error: "Request failed" }));
    }
  }

  if (requestUrl.pathname === "/log.php") {
    await sendJsonResult(writeLocalLog);
    return;
  }

  if (requestUrl.pathname === "/guestbook.php") {
    await sendJsonResult(handleGuestbook);
    return;
  }

  if (requestUrl.pathname === "/upload-photo.php") {
    await sendJsonResult(handlePhotoUpload);
    return;
  }

  if (requestUrl.pathname === "/gallery.php") {
    await sendJsonResult(handleGallery);
    return;
  }

  if (requestUrl.pathname.startsWith("/logs/")) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  const fileResult = await chooseFile(requestUrl.pathname);

  if (!fileResult) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  response.writeHead(fileResult.status, {
    "content-type": types[extname(fileResult.path)] || "application/octet-stream",
    "cache-control": "no-store"
  });
  createReadStream(fileResult.path).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Wedding thank-you site running at http://${host}:${port}`);
  console.log(`Serving ${root}`);
  console.log(`Try http://${host}:${port}/en/test-en`);
});
