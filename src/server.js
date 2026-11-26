import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import areas from "./routes/areas.js";
import espacios from "./routes/espacios.js";
import proyectos from "./routes/proyectos.js";
import obras from "./routes/obras.js";
import inmuebles from "./routes/inmuebles.js";
import afectaciones from "./routes/afectaciones.js";
import datos from "./routes/datos.js";
import { requireApiKey } from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC = path.join(__dirname, "..", "static");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 8765;

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", requireApiKey);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, servicio: "visor-obras" });
});

app.use("/api/datos", datos);
app.use("/api/areas", areas);
app.use("/api/espacios", espacios);
app.use("/api/proyectos", proyectos);
app.use("/api/obras", obras);
app.use("/api/inmuebles", inmuebles);
app.use("/api/afectaciones", afectaciones);

app.use(express.static(STATIC));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, HOST, () => {
  console.log(`Visor + API en http://${HOST}:${PORT}`);
  console.log(`Health: http://${HOST}:${PORT}/api/health`);
});
