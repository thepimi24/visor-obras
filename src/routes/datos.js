import { Router } from "express";
import db from "../db.js";

const router = Router();

const TABLAS = ["area", "espacio", "proyecto", "obra", "inmuebles", "afectacion"];

/**
 * GET /api/datos
 * Compatible con el visor actual (static/app.js): devuelve todas las tablas.
 */
router.get("/", (_req, res) => {
  const datos = {};
  for (const tabla of TABLAS) {
    datos[tabla] = db.prepare(`SELECT * FROM ${tabla} ORDER BY 1`).all();
  }
  res.set("Cache-Control", "no-store");
  res.json(datos);
});

export default router;
