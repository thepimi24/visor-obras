import { Router } from "express";
import db from "../db.js";
import { enviarError, faltan, limpiar } from "../helpers.js";

const router = Router();

router.get("/", (req, res) => {
  const { id_area } = req.query;
  let filas;
  if (id_area !== undefined) {
    filas = db
      .prepare("SELECT * FROM espacio WHERE id_area = ? ORDER BY id_espacio")
      .all(Number(id_area));
  } else {
    filas = db.prepare("SELECT * FROM espacio ORDER BY id_espacio").all();
  }
  res.json(filas);
});

router.get("/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM espacio WHERE id_espacio = ?")
    .get(Number(req.params.id));
  if (!fila) return enviarError(res, 404, "Espacio no encontrado");
  res.json(fila);
});

router.post("/", (req, res) => {
  const error = faltan(req.body, ["name_espacio", "id_area"]);
  if (error) return enviarError(res, 400, error);

  const area = db
    .prepare("SELECT id_area FROM area WHERE id_area = ?")
    .get(Number(req.body.id_area));
  if (!area) return enviarError(res, 400, "id_area no existe");

  try {
    const info = db
      .prepare(
        `INSERT INTO espacio (name_espacio, id_area)
         VALUES (@name_espacio, @id_area)`
      )
      .run({
        name_espacio: req.body.name_espacio,
        id_area: Number(req.body.id_area),
      });

    const creado = db
      .prepare("SELECT * FROM espacio WHERE id_espacio = ?")
      .get(info.lastInsertRowid);
    res.status(201).json(creado);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const actual = db.prepare("SELECT * FROM espacio WHERE id_espacio = ?").get(id);
  if (!actual) return enviarError(res, 404, "Espacio no encontrado");

  const datos = limpiar({
    name_espacio: req.body.name_espacio,
    id_area: req.body.id_area !== undefined ? Number(req.body.id_area) : undefined,
  });
  if (Object.keys(datos).length === 0) {
    return enviarError(res, 400, "No hay campos para actualizar");
  }

  if (datos.id_area !== undefined) {
    const area = db
      .prepare("SELECT id_area FROM area WHERE id_area = ?")
      .get(datos.id_area);
    if (!area) return enviarError(res, 400, "id_area no existe");
  }

  const merged = { ...actual, ...datos };
  try {
    db.prepare(
      `UPDATE espacio
       SET name_espacio = @name_espacio, id_area = @id_area
       WHERE id_espacio = @id_espacio`
    ).run(merged);
  } catch (err) {
    return enviarError(res, 400, err.message);
  }

  res.json(db.prepare("SELECT * FROM espacio WHERE id_espacio = ?").get(id));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const info = db.prepare("DELETE FROM espacio WHERE id_espacio = ?").run(id);
    if (info.changes === 0) return enviarError(res, 404, "Espacio no encontrado");
    res.status(204).send();
  } catch {
    return enviarError(
      res,
      409,
      "No se puede eliminar: hay obras que usan este espacio"
    );
  }
});

export default router;
