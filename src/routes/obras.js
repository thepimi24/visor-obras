import { Router } from "express";
import db from "../db.js";
import { enviarError, faltan, limpiar } from "../helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const { id_proyecto, id_espacio, id_area_trabajo, estado } = req.query;
  const condiciones = [];
  const params = [];

  if (id_proyecto !== undefined) {
    condiciones.push("id_proyecto = ?");
    params.push(Number(id_proyecto));
  }
  if (id_espacio !== undefined) {
    condiciones.push("id_espacio = ?");
    params.push(Number(id_espacio));
  }
  if (id_area_trabajo !== undefined) {
    condiciones.push("id_area_trabajo = ?");
    params.push(Number(id_area_trabajo));
  }
  if (estado !== undefined) {
    condiciones.push("estado_obra_proyecto = ?");
    params.push(estado);
  }

  const where =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const filas = db
    .prepare(`SELECT * FROM obra ${where} ORDER BY id_obra_proyecto`)
    .all(...params);
  res.json(filas);
});

router.get("/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM obra WHERE id_obra_proyecto = ?")
    .get(Number(req.params.id));
  if (!fila) return enviarError(res, 404, "Obra no encontrada");
  res.json(fila);
});

/** Inmuebles vinculados a una obra. */
router.get("/:id/inmuebles", (req, res) => {
  const id = Number(req.params.id);
  const obra = db
    .prepare("SELECT id_obra_proyecto FROM obra WHERE id_obra_proyecto = ?")
    .get(id);
  if (!obra) return enviarError(res, 404, "Obra no encontrada");

  const inmuebles = db
    .prepare(
      "SELECT * FROM inmuebles WHERE id_obra_proyecto = ? ORDER BY id_inmueble"
    )
    .all(id);
  res.json(inmuebles);
});

router.post("/", (req, res) => {
  const error = faltan(req.body, [
    "name_obra_proyecto",
    "estado_obra_proyecto",
    "id_area_trabajo",
    "id_espacio",
    "id_proyecto",
  ]);
  if (error) return enviarError(res, 400, error);

  const id_area_trabajo = Number(req.body.id_area_trabajo);
  const id_espacio = Number(req.body.id_espacio);
  const id_proyecto = Number(req.body.id_proyecto);

  if (!db.prepare("SELECT 1 FROM area WHERE id_area = ?").get(id_area_trabajo)) {
    return enviarError(res, 400, "id_area_trabajo no existe");
  }
  if (!db.prepare("SELECT 1 FROM espacio WHERE id_espacio = ?").get(id_espacio)) {
    return enviarError(res, 400, "id_espacio no existe");
  }
  if (
    !db.prepare("SELECT 1 FROM proyecto WHERE id_proyecto = ?").get(id_proyecto)
  ) {
    return enviarError(res, 400, "id_proyecto no existe");
  }

  try {
    const info = db
      .prepare(
        `INSERT INTO obra
           (name_obra_proyecto, estado_obra_proyecto, descripcion_obra,
            id_area_trabajo, notas_obra, id_espacio, id_proyecto)
         VALUES
           (@name_obra_proyecto, @estado_obra_proyecto, @descripcion_obra,
            @id_area_trabajo, @notas_obra, @id_espacio, @id_proyecto)`
      )
      .run({
        name_obra_proyecto: req.body.name_obra_proyecto,
        estado_obra_proyecto: req.body.estado_obra_proyecto,
        descripcion_obra: req.body.descripcion_obra ?? null,
        id_area_trabajo,
        notas_obra: req.body.notas_obra ?? null,
        id_espacio,
        id_proyecto,
      });

    const creada = db
      .prepare("SELECT * FROM obra WHERE id_obra_proyecto = ?")
      .get(info.lastInsertRowid);
    res.status(201).json(creada);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const actual = db
    .prepare("SELECT * FROM obra WHERE id_obra_proyecto = ?")
    .get(id);
  if (!actual) return enviarError(res, 404, "Obra no encontrada");

  const datos = limpiar({
    name_obra_proyecto: req.body.name_obra_proyecto,
    estado_obra_proyecto: req.body.estado_obra_proyecto,
    descripcion_obra: req.body.descripcion_obra,
    id_area_trabajo:
      req.body.id_area_trabajo !== undefined
        ? Number(req.body.id_area_trabajo)
        : undefined,
    notas_obra: req.body.notas_obra,
    id_espacio:
      req.body.id_espacio !== undefined ? Number(req.body.id_espacio) : undefined,
    id_proyecto:
      req.body.id_proyecto !== undefined
        ? Number(req.body.id_proyecto)
        : undefined,
  });
  if (Object.keys(datos).length === 0) {
    return enviarError(res, 400, "No hay campos para actualizar");
  }

  if (
    datos.id_area_trabajo !== undefined &&
    !db.prepare("SELECT 1 FROM area WHERE id_area = ?").get(datos.id_area_trabajo)
  ) {
    return enviarError(res, 400, "id_area_trabajo no existe");
  }
  if (
    datos.id_espacio !== undefined &&
    !db.prepare("SELECT 1 FROM espacio WHERE id_espacio = ?").get(datos.id_espacio)
  ) {
    return enviarError(res, 400, "id_espacio no existe");
  }
  if (
    datos.id_proyecto !== undefined &&
    !db
      .prepare("SELECT 1 FROM proyecto WHERE id_proyecto = ?")
      .get(datos.id_proyecto)
  ) {
    return enviarError(res, 400, "id_proyecto no existe");
  }

  const merged = { ...actual, ...datos };
  try {
    db.prepare(
      `UPDATE obra
       SET name_obra_proyecto = @name_obra_proyecto,
           estado_obra_proyecto = @estado_obra_proyecto,
           descripcion_obra = @descripcion_obra,
           id_area_trabajo = @id_area_trabajo,
           notas_obra = @notas_obra,
           id_espacio = @id_espacio,
           id_proyecto = @id_proyecto
       WHERE id_obra_proyecto = @id_obra_proyecto`
    ).run(merged);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }

  res.json(
    db.prepare("SELECT * FROM obra WHERE id_obra_proyecto = ?").get(id)
  );
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const info = db
      .prepare("DELETE FROM obra WHERE id_obra_proyecto = ?")
      .run(id);
    if (info.changes === 0) return enviarError(res, 404, "Obra no encontrada");
    res.status(204).send();
  } catch {
    return enviarError(
      res,
      409,
      "No se puede eliminar: hay inmuebles vinculados a esta obra"
    );
  }
});

export default router;
