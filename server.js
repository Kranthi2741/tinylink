import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

import linkRoutes from "./routes/linkRoutes.js";
import { redirectUrl } from "./controllers/linkController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // for frontend assets

app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    version: "1.0",
    uptime: process.uptime(),
    timestamp: new Date(),
    status: "running",
  });
});

app.get("/code/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stats.html"));
});

app.use("/api", linkRoutes);

app.get("/:code", redirectUrl);

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
