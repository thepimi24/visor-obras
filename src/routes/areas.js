import { Router } from "express";
import db from "../db.js";
import { enviarError, faltan, limpiar } from "../helpers.js";

const router = Router();

router.get("/", (_req, res) => {
  const filas = db.prepare("SELECT * FROM area ORDER BY id_area").all();
  res.json(filas);
});

router.get("/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM area WHERE id_area = ?")
    .get(Number(req.params.id));
  if (!fila) return enviarError(res, 404, "Área no encontrada");
  res.json(fila);
});

router.post("/", (req, res) => {
  const error = faltan(req.body, ["name_area"]);
  if (error) return enviarError(res, 400, error);

  const { name_area, descripcion_area = null, notas_area = null } = req.body;
  const info = db
    .prepare(
      `INSERT INTO area (name_area, descripcion_area, notas_area)
       VALUES (@name_area, @descripcion_area, @notas_area)`
    )
    .run({ name_area, descripcion_area, notas_area });

  const creada = db
    .prepare("SELECT * FROM area WHERE id_area = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(creada);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const actual = db.prepare("SELECT * FROM area WHERE id_area = ?").get(id);
  if (!actual) return enviarError(res, 404, "Área no encontrada");

  const datos = limpiar({
    name_area: req.body.name_area,
    descripcion_area: req.body.descripcion_area,
    notas_area: req.body.notas_area,
  });
  if (Object.keys(datos).length === 0) {
    return enviarError(res, 400, "No hay campos para actualizar");
  }

  const merged = { ...actual, ...datos };
  db.prepare(
    `UPDATE area
     SET name_area = @name_area,
         descripcion_area = @descripcion_area,
         notas_area = @notas_area
     WHERE id_area = @id_area`
  ).run(merged);

  res.json(db.prepare("SELECT * FROM area WHERE id_area = ?").get(id));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const info = db.prepare("DELETE FROM area WHERE id_area = ?").run(id);
    if (info.changes === 0) return enviarError(res, 404, "Área no encontrada");
    res.status(204).send();
  } catch (err) {
    return enviarError(
      res,
      409,
      "No se puede eliminar: hay espacios, obras o afectaciones que la usan"
    );
  }
});

export default router;
