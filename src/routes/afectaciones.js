import { Router } from "express";
import db from "../db.js";
import { enviarError, faltan, limpiar } from "../helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const { id_area, name_especialidad } = req.query;
  const condiciones = [];
  const params = [];

  if (id_area !== undefined) {
    condiciones.push("id_area = ?");
    params.push(Number(id_area));
  }
  if (name_especialidad !== undefined) {
    condiciones.push("name_especialidad = ?");
    params.push(name_especialidad);
  }

  const where =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const filas = db
    .prepare(`SELECT * FROM afectacion ${where} ORDER BY id_afectacion`)
    .all(...params);
  res.json(filas);
});

router.get("/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM afectacion WHERE id_afectacion = ?")
    .get(Number(req.params.id));
  if (!fila) return enviarError(res, 404, "Afectación no encontrada");
  res.json(fila);
});

router.post("/", (req, res) => {
  const error = faltan(req.body, [
    "name_afectacion",
    "name_especialidad",
    "id_area",
  ]);
  if (error) return enviarError(res, 400, error);

  const id_area = Number(req.body.id_area);
  if (!db.prepare("SELECT 1 FROM area WHERE id_area = ?").get(id_area)) {
    return enviarError(res, 400, "id_area no existe");
  }

  try {
    const info = db
      .prepare(
        `INSERT INTO afectacion
           (name_afectacion, name_especialidad, id_area)
         VALUES
           (@name_afectacion, @name_especialidad, @id_area)`
      )
      .run({
        name_afectacion: req.body.name_afectacion,
        name_especialidad: req.body.name_especialidad,
        id_area,
      });

    const creada = db
      .prepare("SELECT * FROM afectacion WHERE id_afectacion = ?")
      .get(info.lastInsertRowid);
    res.status(201).json(creada);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const actual = db
    .prepare("SELECT * FROM afectacion WHERE id_afectacion = ?")
    .get(id);
  if (!actual) return enviarError(res, 404, "Afectación no encontrada");

  const datos = limpiar({
    name_afectacion: req.body.name_afectacion,
    name_especialidad: req.body.name_especialidad,
    id_area:
      req.body.id_area !== undefined ? Number(req.body.id_area) : undefined,
  });
  if (Object.keys(datos).length === 0) {
    return enviarError(res, 400, "No hay campos para actualizar");
  }

  if (
    datos.id_area !== undefined &&
    !db.prepare("SELECT 1 FROM area WHERE id_area = ?").get(datos.id_area)
  ) {
    return enviarError(res, 400, "id_area no existe");
  }

  const merged = { ...actual, ...datos };
  try {
    db.prepare(
      `UPDATE afectacion
       SET name_afectacion = @name_afectacion,
           name_especialidad = @name_especialidad,
           id_area = @id_area
       WHERE id_afectacion = @id_afectacion`
    ).run(merged);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }

  res.json(
    db.prepare("SELECT * FROM afectacion WHERE id_afectacion = ?").get(id)
  );
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const info = db
    .prepare("DELETE FROM afectacion WHERE id_afectacion = ?")
    .run(id);
  if (info.changes === 0) return enviarError(res, 404, "Afectación no encontrada");
  res.status(204).send();
});

export default router;
