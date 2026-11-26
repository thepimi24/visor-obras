# Obras · `/api/obras`

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/obras` | Filtros `id_proyecto`, `id_espacio`, `id_area_trabajo`, `estado` |
| GET | `/api/obras/:id` | Detalle |
| GET | `/api/obras/:id/inmuebles` | Inmuebles vinculados |
| POST | `/api/obras` | Valida `id_proyecto`, `id_espacio`, `id_area_trabajo` |
| PUT | `/api/obras/:id` | Parcial con las mismas FKs |
| DELETE | `/api/obras/:id` | 409 si hay inmuebles |

Al crear, el backend rechaza si `id_proyecto` no existe.
