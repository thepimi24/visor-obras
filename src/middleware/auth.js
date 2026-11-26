/**
 * Auth opcional por API key (header x-api-key).
 * Desactivada si no hay process.env.API_KEY.
 */
export function requireApiKey(req, res, next) {
  const esperado = process.env.API_KEY;
  if (!esperado) return next();

  const recibido = req.get("x-api-key");
  if (recibido && recibido === esperado) return next();

  return res.status(401).json({ error: "API key inválida o ausente" });
}
