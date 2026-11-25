/** Respuesta JSON de error corta. */
export function enviarError(res, status, mensaje) {
  return res.status(status).json({ error: mensaje });
}

/** Quita campos undefined de un objeto (para updates parciales). */
export function limpiar(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined)
  );
}

/**
 * Valida que el body traiga los campos requeridos.
 * Devuelve null si está bien, o un string de error.
 */
export function faltan(body, campos) {
  const ausentes = campos.filter(
    (campo) => body[campo] === undefined || body[campo] === null || body[campo] === ""
  );
  if (ausentes.length === 0) return null;
  return `Faltan campos: ${ausentes.join(", ")}`;
}
