# Espacios · `/api/espacios`

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/espacios` | Filtro opcional `?id_area=` |
| GET | `/api/espacios/:id` | 404 si no existe |
| POST | `/api/espacios` | Requiere `name_espacio`, `id_area` |
| PUT | `/api/espacios/:id` | Valida que `id_area` exista |
| DELETE | `/api/espacios/:id` | 409 si hay obras que lo usan |

Un espacio siempre pertenece a un área (`espacio.id_area`).
