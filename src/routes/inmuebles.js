import { Router } from "express";
import db from "../db.js";
import { enviarError, faltan, limpiar } from "../helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const { id_obra_proyecto, estado_inmueble } = req.query;
  const condiciones = [];
  const params = [];

  if (id_obra_proyecto !== undefined) {
    condiciones.push("id_obra_proyecto = ?");
    params.push(Number(id_obra_proyecto));
  }
  if (estado_inmueble !== undefined) {
    condiciones.push("estado_inmueble = ?");
    params.push(estado_inmueble);
  }

  const where =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const filas = db
    .prepare(`SELECT * FROM inmuebles ${where} ORDER BY id_inmueble`)
    .all(...params);
  res.json(filas);
});

router.get("/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM inmuebles WHERE id_inmueble = ?")
    .get(Number(req.params.id));
  if (!fila) return enviarError(res, 404, "Inmueble no encontrado");
  res.json(fila);
});

router.post("/", (req, res) => {
  const error = faltan(req.body, [
    "name_inmueble",
    "id_obra_proyecto",
    "estado_inmueble",
    "name_propietario",
  ]);
  if (error) return enviarError(res, 400, error);

  const id_obra_proyecto = Number(req.body.id_obra_proyecto);
  if (
    !db
      .prepare("SELECT 1 FROM obra WHERE id_obra_proyecto = ?")
      .get(id_obra_proyecto)
  ) {
    return enviarError(res, 400, "id_obra_proyecto no existe");
  }

  try {
    const info = db
      .prepare(
        `INSERT INTO inmuebles
           (name_inmueble, id_obra_proyecto, estado_inmueble,
            name_propietario, name_condominio, name_residencia)
         VALUES
           (@name_inmueble, @id_obra_proyecto, @estado_inmueble,
            @name_propietario, @name_condominio, @name_residencia)`
      )
      .run({
        name_inmueble: req.body.name_inmueble,
        id_obra_proyecto,
        estado_inmueble: req.body.estado_inmueble,
        name_propietario: req.body.name_propietario,
        name_condominio: req.body.name_condominio ?? null,
        name_residencia: req.body.name_residencia ?? null,
      });

    const creado = db
      .prepare("SELECT * FROM inmuebles WHERE id_inmueble = ?")
      .get(info.lastInsertRowid);
    res.status(201).json(creado);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const actual = db
    .prepare("SELECT * FROM inmuebles WHERE id_inmueble = ?")
    .get(id);
  if (!actual) return enviarError(res, 404, "Inmueble no encontrado");

  const datos = limpiar({
    name_inmueble: req.body.name_inmueble,
    id_obra_proyecto:
      req.body.id_obra_proyecto !== undefined
        ? Number(req.body.id_obra_proyecto)
        : undefined,
    estado_inmueble: req.body.estado_inmueble,
    name_propietario: req.body.name_propietario,
    name_condominio: req.body.name_condominio,
    name_residencia: req.body.name_residencia,
  });
  if (Object.keys(datos).length === 0) {
    return enviarError(res, 400, "No hay campos para actualizar");
  }

  if (
    datos.id_obra_proyecto !== undefined &&
    !db
      .prepare("SELECT 1 FROM obra WHERE id_obra_proyecto = ?")
      .get(datos.id_obra_proyecto)
  ) {
    return enviarError(res, 400, "id_obra_proyecto no existe");
  }

  const merged = { ...actual, ...datos };
  try {
    db.prepare(
      `UPDATE inmuebles
       SET name_inmueble = @name_inmueble,
           id_obra_proyecto = @id_obra_proyecto,
           estado_inmueble = @estado_inmueble,
           name_propietario = @name_propietario,
           name_condominio = @name_condominio,
           name_residencia = @name_residencia
       WHERE id_inmueble = @id_inmueble`
    ).run(merged);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }

  res.json(db.prepare("SELECT * FROM inmuebles WHERE id_inmueble = ?").get(id));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const info = db.prepare("DELETE FROM inmuebles WHERE id_inmueble = ?").run(id);
    if (info.changes === 0) return enviarError(res, 404, "Inmueble no encontrado");
    res.status(204).send();
  } catch {
    return enviarError(
      res,
      409,
      "No se puede eliminar: algún proyecto apunta a este inmueble"
    );
  }
});

export default router;
