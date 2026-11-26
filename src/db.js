import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT, "proyecto_demo.db");
const ESQUEMA_PATH = path.join(ROOT, "esquema_proyecto.sql");

function asegurarBase() {
  if (fs.existsSync(DB_PATH)) return;

  if (!fs.existsSync(ESQUEMA_PATH)) {
    throw new Error(
      `No está ${path.basename(DB_PATH)} ni ${path.basename(ESQUEMA_PATH)}`
    );
  }

  const esquema = fs.readFileSync(ESQUEMA_PATH, "utf8");
  const temporal = new Database(DB_PATH);
  try {
    temporal.exec(esquema);
  } finally {
    temporal.close();
  }
  console.log(`Base creada desde ${path.basename(ESQUEMA_PATH)}`);
}

asegurarBase();

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

export default db;
