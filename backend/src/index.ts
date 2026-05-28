import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { volunteersRouter } from "./routes/volunteers";
import { opportunitiesRouter } from "./routes/opportunities";
import facilitiesRouter from "./routes/facilities";
import { messagesRouter } from "./routes/messages";
import { usersRouter } from "./routes/users";
import { adminRouter, seedAdminAccount } from "./routes/admin";
import { logger } from "hono/logger";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// File upload endpoint
app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const storageForm = new FormData();
  storageForm.append("file", file);

  const response = await fetch("https://storage.vibecodeapp.com/v1/files/upload", {
    method: "POST",
    body: storageForm,
  });

  if (!response.ok) {
    const error = await response.json() as { error?: string };
    return c.json({ error: error.error || "Upload failed" }, 500);
  }

  const result = await response.json() as { file: { id: string; url: string; originalFilename: string; contentType: string; sizeBytes: number } };
  return c.json({
    data: {
      id: result.file.id,
      url: result.file.url,
      filename: result.file.originalFilename,
      contentType: result.file.contentType,
      sizeBytes: result.file.sizeBytes,
    }
  });
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/volunteers", volunteersRouter);
app.route("/api/opportunities", opportunitiesRouter);
app.route("/api/facilities", facilitiesRouter);
app.route("/api/messages", messagesRouter);
app.route("/api/users", usersRouter);
app.route("/api/admin", adminRouter);

// Seed admin account on startup
seedAdminAccount().catch(console.error);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
