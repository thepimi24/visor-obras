import { Router } from "express";
import db from "../db.js";
import { enviarError, faltan, limpiar } from "../helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const { check_estatus } = req.query;
  let filas;
  if (check_estatus !== undefined) {
    filas = db
      .prepare(
        "SELECT * FROM proyecto WHERE check_estatus = ? ORDER BY id_proyecto"
      )
      .all(check_estatus);
  } else {
    filas = db.prepare("SELECT * FROM proyecto ORDER BY id_proyecto").all();
  }
  res.json(filas);
});

router.get("/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM proyecto WHERE id_proyecto = ?")
    .get(Number(req.params.id));
  if (!fila) return enviarError(res, 404, "Proyecto no encontrado");
  res.json(fila);
});

/** Obras de un proyecto. */
router.get("/:id/obras", (req, res) => {
  const id = Number(req.params.id);
  const proyecto = db
    .prepare("SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?")
    .get(id);
  if (!proyecto) return enviarError(res, 404, "Proyecto no encontrado");

  const obras = db
    .prepare("SELECT * FROM obra WHERE id_proyecto = ? ORDER BY id_obra_proyecto")
    .all(id);
  res.json(obras);
});

/**
 * Crear proyecto.
 * Nota: proyecto.id_inmueble referencia inmuebles con FK diferida.
 * El inmueble debe existir (o crearse en la misma transacción vía otro endpoint).
 */
router.post("/", (req, res) => {
  const error = faltan(req.body, [
    "check_estatus",
    "name_contact",
    "id_inmueble",
    "ubicacion",
  ]);
  if (error) return enviarError(res, 400, error);

  const inmueble = db
    .prepare("SELECT id_inmueble FROM inmuebles WHERE id_inmueble = ?")
    .get(Number(req.body.id_inmueble));
  if (!inmueble) return enviarError(res, 400, "id_inmueble no existe");

  try {
    const info = db
      .prepare(
        `INSERT INTO proyecto
           (check_estatus, name_contact, descripcion, id_inmueble, ubicacion)
         VALUES
           (@check_estatus, @name_contact, @descripcion, @id_inmueble, @ubicacion)`
      )
      .run({
        check_estatus: req.body.check_estatus,
        name_contact: req.body.name_contact,
        descripcion: req.body.descripcion ?? null,
        id_inmueble: Number(req.body.id_inmueble),
        ubicacion: req.body.ubicacion,
      });

    const creado = db
      .prepare("SELECT * FROM proyecto WHERE id_proyecto = ?")
      .get(info.lastInsertRowid);
    res.status(201).json(creado);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const actual = db
    .prepare("SELECT * FROM proyecto WHERE id_proyecto = ?")
    .get(id);
  if (!actual) return enviarError(res, 404, "Proyecto no encontrado");

  const datos = limpiar({
    check_estatus: req.body.check_estatus,
    name_contact: req.body.name_contact,
    descripcion: req.body.descripcion,
    id_inmueble:
      req.body.id_inmueble !== undefined
        ? Number(req.body.id_inmueble)
        : undefined,
    ubicacion: req.body.ubicacion,
  });
  if (Object.keys(datos).length === 0) {
    return enviarError(res, 400, "No hay campos para actualizar");
  }

  if (datos.id_inmueble !== undefined) {
    const inmueble = db
      .prepare("SELECT id_inmueble FROM inmuebles WHERE id_inmueble = ?")
      .get(datos.id_inmueble);
    if (!inmueble) return enviarError(res, 400, "id_inmueble no existe");
  }

  const merged = { ...actual, ...datos };
  try {
    db.prepare(
      `UPDATE proyecto
       SET check_estatus = @check_estatus,
           name_contact = @name_contact,
           descripcion = @descripcion,
           id_inmueble = @id_inmueble,
           ubicacion = @ubicacion
       WHERE id_proyecto = @id_proyecto`
    ).run(merged);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }

  res.json(db.prepare("SELECT * FROM proyecto WHERE id_proyecto = ?").get(id));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const info = db.prepare("DELETE FROM proyecto WHERE id_proyecto = ?").run(id);
    if (info.changes === 0) return enviarError(res, 404, "Proyecto no encontrado");
    res.status(204).send();
  } catch {
    return enviarError(
      res,
      409,
      "No se puede eliminar: hay obras vinculadas a este proyecto"
    );
  }
});

export default router;
